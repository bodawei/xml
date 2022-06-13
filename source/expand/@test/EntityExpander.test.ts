/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { Problem, PROBLEM } from 'basic';
import {
   ParseToken,
   NOTATION_DECLARATION_PTOKEN,
   AttListDeclarationPToken,
   CharRefPToken,
   ElementDeclarationPToken,
   GeneralEntityReferencePToken,
   NotationDeclarationPToken,
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   TextPToken,
} from 'pToken';
import { toSToken, STokenSource } from 'basic';
import { WellFormedError, wellFormedErrorCodes } from 'wellformedness';
import {
   CONDITIONAL_START_PTOKEN,
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ConditionalStartPToken,
   DocTypeEndPToken,
   DocTypeStartPToken,
   ElementStartPToken,
   ElementEmptyPToken,
} from 'token';

import * as attListDecl from '../../pToken/token/attListDeclaration';
import * as elementDeclaration from '../../pToken/token/elementDeclaration';
import * as entityDeclaration from '../../pToken/bridge/entityDeclaration';
import * as notationDeclaration from '../../pToken/token/notationDeclaration';
import * as expandAttributes from '../utils/expandAttributes';
import * as expandEntityValueModule from '../utils/expandEntityValue';
import { EXTERNAL_DTD_PSEUDO_TOKEN } from '../utils/ExternalDtdSubsetPseudoToken';
import * as streamParsedReplacementText from '../utils/streamParsedReplacementText';
import * as expandMarkupUnexpanded from '../utils/expandMarkupUnexpanded';
import { EntityExpander } from '../EntityExpander';
import { AttributeValueResults, ExpandParams, RetrieveResults } from '../types';
import { EntityContextStack } from '../utils/EntityContextStack';
import { EntityId } from 'basic';

const WFEID = wellFormedErrorCodes.id;

describe('EntityExpander (unit)', () => {
   let setupConditionalSpy: jasmine.Spy;
   let expandMarkupUnexpandedSpy: jasmine.Spy;
   let resumeParseNotationDeclarationSpy: jasmine.Spy;
   let resolveEntityId: (a: any, b: any) => any;

   beforeEach(() => {
      resolveEntityId = () => '';
   });

   function harvestTypes(results: Array<ParseToken>): Array<string> {
      return results.map((element) => element.type);
   }

   function retrieveExternalEntity(): RetrieveResults {
      const sTokenSource = new STokenSource();

      return {
         sTokenSource,
         getErrors(): Array<Problem> {
            return [];
         },
      };
   }

   function parseAttributeValue(
      sTokenSource: STokenSource,
      done: (results: AttributeValueResults) => void,
   ): void {
      done({ newValue: [], errors: [] });
   }

   function doExpand(
      tokens: Array<ParseToken>,
      validate: boolean,
      allDone: (results: Array<ParseToken>) => void,
   ): void {
      const results: Array<ParseToken> = [];
      const unsent = tokens.slice(0);

      const entityExpander = new EntityExpander(validate, results.push.bind(results), {
         parseBody: (): void => {},
         parseEntityValue: (): void => {},
         resolveEntityId: resolveEntityId,
         retrieveExternalEntity,
         parseAttributeValue,
      });

      function processNextToken(): void {
         const nextToken = unsent.shift();

         if (!nextToken) {
            allDone(results);
            return;
         }

         entityExpander.expandPToken(nextToken, processNextToken);
      }

      processNextToken();
   }

   describe('passes most token types through unchanged', () => {
      let textPToken: TextPToken;

      beforeEach(() => {
         textPToken = new TextPToken({ text: toSToken('foo') });
      });

      it('passes the PToken through', (done) => {
         doExpand([textPToken], true, (results) => {
            expect(results).toEqual([textPToken]);
            done();
         });
      });
   });

   describe('EntityId', () => {
      let entityId: EntityId;

      beforeEach(() => {
         entityId = new EntityId('systemFoo', 'publicbar');
      });

      it('is passed straight through', (done) => {
         doExpand([entityId], true, (results) => {
            expect(results).toEqual([entityId]);
            done();
         });
      });

      it('adds the document entityId to the context stack', (done) => {
         const docTypeStart = new DocTypeStartPToken({
            open: toSToken('<!'),
            name: toSToken('root'),
            externalId: {
               system: {
                  value: [new TextPToken({ text: toSToken('systemFoo') })],
               },
            },
         });
         const docTypeEnd = new DocTypeEndPToken({
            docTypeStartPToken: docTypeStart,
            close: toSToken('>'),
         });
         const streamParsedReplacementTextSpy: jasmine.Spy = spyOn(
            streamParsedReplacementText,
            'streamParsedReplacementText',
         );
         streamParsedReplacementTextSpy.and.callFake((token, params, stack, callback) => {
            callback(undefined, () => {});
         });

         doExpand([entityId, docTypeStart, docTypeEnd], true, () => {
            const args = streamParsedReplacementTextSpy.calls.argsFor(0);
            const stack = args[2] as EntityContextStack;
            expect(stack.getCurrentEntityLoc()).toEqual(entityId);
            done();
         });
      });
   });

   describe('DOCTYPE declaration', () => {
      let docTypeStart: DocTypeStartPToken;
      let docTypeEnd: DocTypeEndPToken;

      beforeEach(() => {
         docTypeStart = new DocTypeStartPToken({
            open: toSToken('<!'),
            name: toSToken('root'),
         });
         docTypeEnd = new DocTypeEndPToken({
            docTypeStartPToken: docTypeStart,
            close: toSToken('>'),
         });
      });

      it('adds no internal or external entity markers if there are none', (done) => {
         doExpand([docTypeStart, docTypeEnd], true, (results) => {
            expect(harvestTypes(results)).toEqual([DOCTYPE_START_PTOKEN, DOCTYPE_END_PTOKEN]);
            done();
         });
      });

      it('calls the streamParsedReplacementText() function with the subset token, prams and a callback', (done) => {
         docTypeStart = new DocTypeStartPToken({
            open: toSToken('<!'),
            name: toSToken('root'),
            externalId: {
               system: {
                  value: [new TextPToken({ text: toSToken('systemFoo') })],
               },
            },
         });
         const streamParsedReplacementTextSpy: jasmine.Spy = spyOn(
            streamParsedReplacementText,
            'streamParsedReplacementText',
         );
         streamParsedReplacementTextSpy.and.callFake((token, params, stack, callback) => {
            callback(undefined, () => {});
         });

         doExpand([docTypeStart, docTypeEnd], true, () => {
            const args = streamParsedReplacementTextSpy.calls.argsFor(0);

            expect(args[0].type).toEqual(EXTERNAL_DTD_PSEUDO_TOKEN);
            expect(args[1].entityDetails).not.toBeUndefined();
            expect(args[2] instanceof EntityContextStack).toEqual(true);
            done();
         });
      });

      it('adds external subset markers when there is an externalId', (done) => {
         docTypeStart = new DocTypeStartPToken({
            open: toSToken('<!'),
            name: toSToken('root'),
            externalId: {
               system: {
                  value: [new TextPToken({ text: toSToken('systemFoo') })],
               },
            },
         });
         const streamParsedReplacementTextSpy: jasmine.Spy = spyOn(
            streamParsedReplacementText,
            'streamParsedReplacementText',
         );
         const notation = new NotationDeclarationPToken({ open: toSToken('<!') });
         streamParsedReplacementTextSpy.and.callFake((token, params, stack, callback) => {
            callback(notation, () => {
               callback(undefined, () => {});
            });
         });

         doExpand([docTypeStart, docTypeEnd], true, (results) => {
            expect(harvestTypes(results)).toEqual([
               DOCTYPE_START_PTOKEN,
               NOTATION_DECLARATION_PTOKEN,
               DOCTYPE_END_PTOKEN,
            ]);
            done();
         });
      });

      it('adds an internal and calls processing of the xternal subset if both subsets are mentioned', (done) => {
         const notation = new NotationDeclarationPToken({ open: toSToken('<!') });
         docTypeStart = new DocTypeStartPToken({
            open: toSToken('<!'),
            name: toSToken('root'),
            openSubset: toSToken('['),
            externalId: {
               system: {
                  value: [new TextPToken({ text: toSToken('systemFoo') })],
               },
            },
         });
         const streamParsedReplacementTextSpy: jasmine.Spy = spyOn(
            streamParsedReplacementText,
            'streamParsedReplacementText',
         );
         const error = new WellFormedError(WFEID.XMLDECL_PARAM_UNKNOWN, ['x']);
         streamParsedReplacementTextSpy.and.callFake(
            (
               token,
               params,
               stack,
               callback: (result: WellFormedError | undefined, cb2: () => void) => void,
            ) => {
               callback(error, () => {
                  callback(undefined, () => {});
               });
            },
         );

         doExpand([docTypeStart, notation, docTypeEnd], true, (results) => {
            expect(harvestTypes(results)).toEqual([
               DOCTYPE_START_PTOKEN,
               NOTATION_DECLARATION_PTOKEN,
               PROBLEM,
               DOCTYPE_END_PTOKEN,
            ]);
            done();
         });
      });

      it('dos not add external subset markers if this is not a validating processor', (done) => {
         const notation = new NotationDeclarationPToken({ open: toSToken('<!') });
         docTypeStart = new DocTypeStartPToken({
            open: toSToken('<!'),
            name: toSToken('root'),
            openSubset: toSToken('['),
            externalId: {
               system: {
                  value: [new TextPToken({ text: toSToken('systemFoo') })],
               },
            },
         });

         doExpand([docTypeStart, notation, docTypeEnd], false, (results) => {
            expect(harvestTypes(results)).toEqual([
               DOCTYPE_START_PTOKEN,
               NOTATION_DECLARATION_PTOKEN,
               DOCTYPE_END_PTOKEN,
            ]);
            done();
         });
      });

      describe('with incomplete conditional sections', () => {
         it('delivers doctype start, conditional section starts in the internal subset, and then doctype end', (done) => {
            const condStart = new ConditionalStartPToken({ open: toSToken('<![') });
            docTypeStart = new DocTypeStartPToken({
               open: toSToken('<!'),
               name: toSToken('root'),
               openSubset: toSToken('['),
            });

            doExpand([docTypeStart, condStart, condStart, docTypeEnd], false, (results) => {
               expect(harvestTypes(results)).toEqual([
                  DOCTYPE_START_PTOKEN,
                  CONDITIONAL_START_PTOKEN,
                  CONDITIONAL_START_PTOKEN,
                  DOCTYPE_END_PTOKEN,
               ]);
               done();
            });
         });

         it('delivers doctype start, conditional section starts in the external subset, and then doctype end', (done) => {
            const streamParsedReplacementTextSpy = spyOn(
               streamParsedReplacementText,
               'streamParsedReplacementText',
            );
            const condStart = new ConditionalStartPToken({ open: toSToken('<![') });
            docTypeStart = new DocTypeStartPToken({
               open: toSToken('<!'),
               name: toSToken('root'),
               externalId: {
                  system: {
                     value: [new TextPToken({ text: toSToken('systemFoo') })],
                  },
               },
            });
            streamParsedReplacementTextSpy.and.callFake(
               (
                  token,
                  params,
                  stack,
                  cb: (token: ConditionalStartPToken | undefined, innerCb: () => void) => void,
               ) => {
                  cb(condStart, () => {});
                  cb(condStart, () => {});
                  cb(undefined, () => {});
               },
            );

            doExpand([docTypeStart, docTypeEnd], true, (results) => {
               expect(harvestTypes(results)).toEqual([
                  DOCTYPE_START_PTOKEN,
                  CONDITIONAL_START_PTOKEN,
                  CONDITIONAL_START_PTOKEN,
                  DOCTYPE_END_PTOKEN,
               ]);
               done();
            });
         });

         // it('delivers doctype start, with conditional sections with perefs, and then doctype end', (done) => {
         //    const condStart = new ConditionalStartPToken({ open: toSToken('<![') });
         //    const condStartWithRf = new ConditionalStartPToken({
         //       open: toSToken('<!['),
         //       peRef: new ParameterEntityReferencePToken({ open: toSToken('%') }),
         //    });
         //    docTypeStart = new DocTypeStartPToken({
         //       open: toSToken('<!'),
         //       name: toSToken('root'),
         //       openSubset: toSToken('['),
         //    });
         //    setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
         //       done({
         //          source: new STokenSource(),
         //       });
         //    });
         //    const results: Array<ParseToken> = [];
         //    const entityExpander = new EntityExpander(false, results.push.bind(results), {
         //       parseBody: (): void => {},
         //       parseEntityValue: (): void => {},
         //       resolveEntityId: () => '',
         //       retrieveExternalEntity,
         //       parseAttributeValue,
         //    });

         //    entityExpander.expandPToken(docTypeStart, () => {});
         //    entityExpander.expandPToken(condStart, () => {});
         //    entityExpander.expandPToken(condStartWithRf, () => {});
         //    entityExpander.expandPToken(condStart, () => {
         //       const args = setupConditionalSpy.calls.argsFor(0);
         //       const stack = args[1].conditionalStack;
         //       const topInfo = stack[stack.length - 1];

         //       entityExpander.expandPToken(docTypeEnd, () => {});
         //       delete topInfo.source;
         //       topInfo.textIsFinished();

         //       expect(harvestTypes(results)).toEqual([
         //          DOCTYPE_START_PTOKEN,
         //          CONDITIONAL_START_PTOKEN,
         //          CONDITIONAL_START_PTOKEN,
         //          CONDITIONAL_START_PTOKEN,
         //          DOCTYPE_END_PTOKEN,
         //       ]);
         //       done();
         //    });
         // });

         it('can accept a doctype incorrectly in the internal subset', (done) => {
            docTypeStart = new DocTypeStartPToken({
               open: toSToken('<!'),
               name: toSToken('root'),
               openSubset: toSToken('['),
            });
            const results: Array<ParseToken> = [];
            const entityExpander = new EntityExpander(false, results.push.bind(results), {
               parseBody: (): void => {},
               parseEntityValue: (): void => {},
               resolveEntityId: () => '',
               retrieveExternalEntity,
               parseAttributeValue,
            });

            entityExpander.expandPToken(docTypeStart, () => {});
            entityExpander.expandPToken(docTypeStart, () => {});
            entityExpander.expandPToken(docTypeEnd, () => {});
            entityExpander.expandPToken(docTypeEnd, () => {});

            expect(harvestTypes(results)).toEqual([
               DOCTYPE_START_PTOKEN,
               DOCTYPE_START_PTOKEN,
               DOCTYPE_END_PTOKEN,
               DOCTYPE_END_PTOKEN,
            ]);
            done();
         });
      });
   });

   describe('NOTATION declaration', () => {
      let notation: NotationDeclarationPToken;

      beforeEach(() => {
         notation = new NotationDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('test'),
         });
      });

      it('passes a declaration with no unassigned values through without changes', (done) => {
         doExpand([notation], true, (results) => {
            expect(results).toEqual([notation]);
            done();
         });
      });

      it('asks resumeParseAttListDeclaration) to finish parsing any unexpanded values', (done) => {
         expandMarkupUnexpandedSpy = spyOn(expandMarkupUnexpanded, 'expandMarkupUnexpanded');
         resumeParseNotationDeclarationSpy = spyOn(
            notationDeclaration,
            'resumeParseNotationDeclaration',
         );
         notation = new NotationDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('test'),
            externalId: {},
            unexpanded: {
               propName: 'externalType',
               tokens: [new TextPToken({ text: toSToken('SYSTEM') })],
            },
         });

         expandMarkupUnexpandedSpy.and.callFake(
            (unexpanded, params, chain, callback: (result: any) => void) => {
               callback({
                  expandedTokens: [new TextPToken({ text: toSToken('PUBLIC') })],
                  byproducts: [],
               });
            },
         );
         resumeParseNotationDeclarationSpy.and.callFake(
            (source, declaration, cb: (result: NotationDeclarationPToken) => void) => {
               cb(
                  new NotationDeclarationPToken(notation, {
                     externalId: {
                        externalType: toSToken('PUBLIC'),
                     },
                  }),
               );
            },
         );

         doExpand([notation], true, (results) => {
            expect(results[0]).toEqual(
               new NotationDeclarationPToken({
                  open: toSToken('<!'),
                  name: toSToken('test'),
                  externalId: {
                     externalType: toSToken('PUBLIC'),
                  },
                  unexpanded: {
                     propName: 'externalType',
                     tokens: [new TextPToken({ text: toSToken('SYSTEM') })],
                  },
               }),
            );
            done();
         });
      });
   });

   describe('ELEMENT declaration', () => {
      let elementDecl: ElementDeclarationPToken;
      let resumeParseElementDeclarationSpy: jasmine.Spy;

      beforeEach(() => {
         resumeParseElementDeclarationSpy = spyOn(
            elementDeclaration,
            'resumeParseElementDeclaration',
         );

         resumeParseElementDeclarationSpy.and.callFake((source, params, callback) => {
            callback(params);
         });

         elementDecl = new ElementDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
         });
      });

      it('passes a declaration with no unassigned values through without changes', (done) => {
         const input = [elementDecl];

         doExpand(input, true, (results) => {
            expect(results).toEqual([elementDecl]);
            done();
         });
      });

      it('asks the element to assign any newly unassigned values to itself', (done) => {
         elementDecl = new ElementDeclarationPToken(elementDecl, {
            unexpanded: {
               tokens: [],
               propName: 'contentSpec',
            },
         });

         doExpand([elementDecl], true, () => {
            expect(resumeParseElementDeclarationSpy).toHaveBeenCalled();
            done();
         });
      });
   });

   describe('ATTLIST declaration', () => {
      let expandAttributeSpy: jasmine.Spy;

      beforeEach(() => {
         expandAttributeSpy = spyOn(expandAttributes, 'expandAttributes');
         let index = 0;

         expandAttributeSpy.and.callFake(
            (
               value: Array<Record<string, any>>,
               params: Record<string, any>,
               stack: EntityContextStack,
               cb: (arg: any) => void,
            ) => {
               const result = value.map(() => {
                  const code = WFEID.XMLDECL_PARAM_UNKNOWN;
                  index++;

                  return {
                     newValue: [new TextPToken({ text: toSToken(`testValue #${index}`) })],
                     byproducts: [new WellFormedError(code, [`${index}`])],
                  };
               });

               cb(result);
            },
         );
      });

      it('processes the default attribute values of the ATTLIST PToken', (done) => {
         const attList = new AttListDeclarationPToken({
            open: toSToken('<!'),
            elementName: toSToken('student'),
            attDefs: [
               {
                  name: toSToken('two'),
                  value: [new CharRefPToken({ open: toSToken('&#') })],
               },
               {
                  name: toSToken('three'),
                  value: [new TextPToken({ text: toSToken('twoValue') })],
               },
            ],
         });
         const error1 = new WellFormedError(WFEID.XMLDECL_PARAM_UNKNOWN, ['1']);
         const error2 = new WellFormedError(WFEID.XMLDECL_PARAM_UNKNOWN, ['2']);
         const expanded = new AttListDeclarationPToken({
            open: toSToken('<!'),
            elementName: toSToken('student'),
            attDefs: [
               {
                  name: toSToken('two'),
                  value: [new TextPToken({ text: toSToken('testValue #1') })],
               },
               {
                  name: toSToken('three'),
                  value: [new TextPToken({ text: toSToken('testValue #2') })],
               },
            ],
         });

         doExpand([attList], true, (results) => {
            expect(results as any).toEqual([error1, error2, expanded]); // any because of WellFormed error
            done();
         });
      });

      it('calls the expandAttributes() routine with the attDefs, expand params and a callback', (done) => {
         const attList = new AttListDeclarationPToken({
            open: toSToken('<!'),
            elementName: toSToken('student'),
            attDefs: [
               {
                  name: toSToken('three'),
                  value: [new TextPToken({ text: toSToken('twoValue') })],
               },
            ],
         });

         doExpand([attList], true, () => {
            const callArgs = expandAttributeSpy.calls.mostRecent().args;

            expect(callArgs[0]).toEqual(attList.attDefs);
            expect(callArgs[1]).not.toBeUndefined();
            expect(callArgs[2] instanceof EntityContextStack).toEqual(true);
            expect(typeof callArgs[3]).toEqual('function');
            done();
         });
      });

      it('asks the AttListDeclarationPToken to assign any newly unassigned values to itself', (done) => {
         expandMarkupUnexpandedSpy = spyOn(expandMarkupUnexpanded, 'expandMarkupUnexpanded');
         const resumeParseAttListDeclarationSpy = spyOn(
            attListDecl,
            'resumeParseAttListDeclaration',
         );
         const attList = new AttListDeclarationPToken({
            open: toSToken('<!'),
            elementName: toSToken('student'),
            attDefs: [],
            unexpanded: {
               propName: 'name',
               tokens: [new TextPToken({ text: toSToken('SYSTEM') })],
            },
         });

         expandMarkupUnexpandedSpy.and.callFake(
            (unexpanded, params, chain, callback: (result: any) => void) => {
               callback({
                  expandedTokens: [new TextPToken({ text: toSToken('PUBLIC') })],
                  byproducts: [],
               });
            },
         );
         resumeParseAttListDeclarationSpy.and.callFake(
            (source, declaration, cb: (result: AttListDeclarationPToken) => void) => {
               cb(
                  new AttListDeclarationPToken(attList, {
                     attDefs: [
                        {
                           name: toSToken('resumed'),
                           value: [],
                        },
                     ],
                  }),
               );
            },
         );

         doExpand([attList], true, (result) => {
            expect(result[1]).toEqual(
               new AttListDeclarationPToken(attList, {
                  attDefs: [
                     {
                        name: toSToken('resumed'),
                        value: [new TextPToken({ text: toSToken('testValue #1') })],
                     },
                  ],
               }),
            );
            done();
         });
      });
   });

   describe('ENTITY declaration', () => {
      let geDecl: GeneralEntityDeclarationPToken;
      let peDecl: ParameterEntityDeclarationPToken;
      let expandEntityValueSpy: jasmine.Spy;
      let resumeParseEntityDeclarationSpy: jasmine.Spy;

      beforeEach(() => {
         resumeParseEntityDeclarationSpy = spyOn(entityDeclaration, 'resumeParseEntityDeclaration');
         expandEntityValueSpy = spyOn(expandEntityValueModule, 'expandEntityValue');
         let index = 0;

         resumeParseEntityDeclarationSpy.and.callFake((source, pToken, cb: (arg: any) => void) => {
            cb(pToken);
         });
         expandEntityValueSpy.and.callFake((pToken, params, chain, cb: (arg: any) => void) => {
            const error = new WellFormedError(WFEID.XMLDECL_PARAM_UNKNOWN, [`${index}`]);
            index++;
            cb({
               newValue: [new TextPToken({ text: toSToken(`testValue #${index}`) })],
               byproducts: [error],
            });
         });
      });

      it('calls expandEntityValue() with the general entity value, expandParams and a callback', (done) => {
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });

         doExpand([geDecl], true, () => {
            const args = expandEntityValueSpy.calls.argsFor(0);

            expect(args[0]).toEqual([new CharRefPToken({ open: toSToken('&#') })]);
            expect(args[1].entityDetails).not.toBeUndefined();
            expect(args[2] instanceof EntityContextStack).toEqual(true);
            expect(typeof args[3]).toEqual('function');
            done();
         });
      });

      it('calls expandEntityValue() with the parameter entity value, expandParams and a callback', (done) => {
         peDecl = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });

         doExpand([peDecl], true, () => {
            const args = expandEntityValueSpy.calls.argsFor(0);

            expect(args[0]).toEqual([new CharRefPToken({ open: toSToken('&#') })]);
            expect(args[1].entityDetails).not.toBeUndefined();
            expect(args[2] instanceof EntityContextStack).toEqual(true);
            expect(typeof args[3]).toEqual('function');
            done();
         });
      });

      it('delivers the geDecl along with any errors that happened while expanding its value', (done) => {
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });
         const error1 = new WellFormedError(WFEID.XMLDECL_PARAM_UNKNOWN, ['0']);

         doExpand([geDecl], true, (results) => {
            expect(results as any).toEqual([error1, geDecl]); // any because of WellFormedError
            done();
         });
      });

      it('does not expand the entity value if this is an external entity', (done) => {
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            externalId: {},
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });

         doExpand([geDecl], true, () => {
            expect(expandEntityValueSpy).not.toHaveBeenCalled();
            done();
         });
      });

      it('does not expand the entity value if this entity has no name', (done) => {
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });

         doExpand([geDecl], true, () => {
            expect(expandEntityValueSpy).not.toHaveBeenCalled();
            done();
         });
      });

      it('does not expand the entity value if this entity is already in the entity details', (done) => {
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });

         doExpand([geDecl, geDecl], true, () => {
            expect(expandEntityValueSpy).toHaveBeenCalledTimes(1);
            done();
         });
      });

      it('does not set up the value in entity details until after calling expandEntityValue()', (done) => {
         let hasGeDecl: boolean;
         let afterCallParams: ExpandParams;
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });

         expandEntityValueSpy.and.callFake((pToken, params, chain, cb) => {
            hasGeDecl = params.entityDetails.hasEntity(geDecl);
            afterCallParams = params;
            cb({ newValue: [new TextPToken({ text: toSToken('testValue') })], byproducts: [] });
         });

         doExpand([geDecl, geDecl], true, () => {
            expect(hasGeDecl).toEqual(false);
            expect(afterCallParams.entityDetails.hasEntity(geDecl)).toEqual(true);
            done();
         });
      });

      it('sets up the entity details with the current entity location when with an internal entity', (done) => {
         let addEntitySpy: jasmine.Spy;
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });
         const entityId = new EntityId('doc_entity');

         expandEntityValueSpy.and.callFake((pToken, params, chain, cb) => {
            addEntitySpy = spyOn(params.entityDetails, 'addEntity');
            cb({ newValue: [new TextPToken({ text: toSToken('testValue') })], byproducts: [] });
         });

         doExpand([entityId, geDecl], true, () => {
            expect(addEntitySpy).toHaveBeenCalledWith(
               geDecl,
               [new TextPToken({ text: toSToken('testValue') })],
               entityId,
            );
            done();
         });
      });

      it('sets up the entity details with the current entity location when with an external entity', (done) => {
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            externalId: {
               system: {
                  value: [new TextPToken({ text: toSToken('the system') })],
               },
            },
         });
         resolveEntityId = jasmine.createSpy();
         const entityId = new EntityId('doc_entity');

         doExpand([entityId, geDecl], true, () => {
            expect(resolveEntityId).toHaveBeenCalledWith(entityId, new EntityId('the system', ''));
            done();
         });
      });

      it('asks the entity declaration to assign any newly unassigned values to itself', (done) => {
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
            unexpanded: {
               propName: 'name',
               tokens: [],
            },
         });

         resumeParseEntityDeclarationSpy.and.callFake((source, existing, callback) => {
            callback(existing);
         });

         doExpand([geDecl], true, () => {
            expect(resumeParseEntityDeclarationSpy).toHaveBeenCalled();
            done();
         });
      });
   });

   // describe('conditional sections', () => {
   //    let condStart: ConditionalStartPToken;
   //    let condEnd: ConditionalEndPToken;

   //    beforeEach(() => {
   //       condEnd = new ConditionalEndPToken({
   //          open: toSToken(']]>'),
   //       });
   //    });

   //    it('passes all contents of an ignore conditional section through unchanged', (done) => {
   //       condStart = new ConditionalStartPToken({
   //          open: toSToken('<[!'),
   //          sectionType: toSToken('IGNORE'),
   //       });

   //       doExpand([condStart, new TextPToken(toSToken('foo')), condEnd], true, (results) => {
   //          const types = results.map((item) => item.type);

   //          expect(types).toEqual([CONDITIONAL_START_PTOKEN, TEXT_PTOKEN, CONDITIONAL_END_PTOKEN]);
   //          done();
   //       });
   //    });

   //    it('passes all contents of an unknown conditional section through unchanged', (done) => {
   //       condStart = new ConditionalStartPToken({
   //          open: toSToken('<[!'),
   //          sectionType: toSToken('OOPSIE'),
   //       });

   //       doExpand([condStart, new TextPToken(toSToken('foo')), condEnd], true, (results) => {
   //          const types = results.map((item) => item.type);

   //          expect(types).toEqual([CONDITIONAL_START_PTOKEN, TEXT_PTOKEN, CONDITIONAL_END_PTOKEN]);
   //          done();
   //       });
   //    });

   //    it('passes all contents of an include conditional section through unchanged', (done) => {
   //       condStart = new ConditionalStartPToken({
   //          open: toSToken('<[!'),
   //          sectionType: toSToken('INCLUDE'),
   //       });

   //       doExpand([condStart, new TextPToken(toSToken('foo')), condEnd], true, (results) => {
   //          const types = results.map((item) => item.type);

   //          expect(types).toEqual([CONDITIONAL_START_PTOKEN, TEXT_PTOKEN, CONDITIONAL_END_PTOKEN]);
   //          done();
   //       });
   //    });

   //    // it('passes all contents of an include conditional section through unchanged', (done) => {
   //    //    condStart = new ConditionalStartPToken({
   //    //       open: toSToken('<[!'),
   //    //       sectionType: toSToken('INCLUDE'),
   //    //    });

   //    //    doExpand([condStart, new TextPToken(toSToken('foo')), condEnd], true, (results) => {
   //    //       const types = results.map((item) => item.type);

   //    //       expect(types).toEqual([CONDITIONAL_START_PTOKEN, TEXT_PTOKEN, CONDITIONAL_END_PTOKEN]);
   //    //       done();
   //    //    });
   //    // });

   //    // it('passes a peRef and other parameters to setupConditional() when the peRef is present', (done) => {
   //    //    const peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
   //    //    condStart = new ConditionalStartPToken({
   //    //       open: toSToken('<[!'),
   //    //       peRef,
   //    //    });
   //    //    setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
   //    //       done({
   //    //          sectionType: toSToken('IGNORE'),
   //    //       });
   //    //    });

   //    //    doExpand([condStart], true, () => {
   //    //       const args = setupConditionalSpy.calls.argsFor(0);
   //    //       expect(args[0]).toEqual(peRef);
   //    //       expect(args[1].utils).not.toBeUndefined(); // inner awareness
   //    //       expect(args[2] instanceof EntityContextStack).toEqual(true);
   //    //       expect(args[3]).toEqual(ParseType.PARAMETER_ENTITY);
   //    //       expect(typeof args[4]).toEqual('function');
   //    //       expect(typeof args[5]).toEqual('function');
   //    //       done();
   //    //    });
   //    // });

   //    // it('creates a new conditional start with the expanded section type added', (done) => {
   //    //    const peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
   //    //    condStart = new ConditionalStartPToken({
   //    //       open: toSToken('<[!'),
   //    //       peRef,
   //    //    });
   //    //    setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
   //    //       done({
   //    //          sectionType: toSToken(' FOO'),
   //    //       });
   //    //    });

   //    //    doExpand([condStart], true, (results) => {
   //    //       expect(results[0]).not.toBe(condStart);
   //    //       expect(results[0]).toEqualRangeless({
   //    //          open: toSToken('<[!'),
   //    //          peRef,
   //    //          sectionType: toSToken(' FOO'),
   //    //       });
   //    //       done();
   //    //    });
   //    // });

   //    // it('adds to the conditional stack with the value from setupConditional()', (done) => {
   //    //    const peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
   //    //    condStart = new ConditionalStartPToken({
   //    //       open: toSToken('<[!'),
   //    //       peRef,
   //    //    });
   //    //    setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
   //    //       done({ source: true });
   //    //    });

   //    //    doExpand([condStart], true, () => {
   //    //       const args = setupConditionalSpy.calls.argsFor(0);

   //    //       expect(args[1].conditionalStack[0]).toEqual({ source: true });
   //    //       done();
   //    //    });
   //    // });

   //    // it('pases text tokens from the expanded conditional without modification', (done) => {
   //    //    const peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
   //    //    condStart = new ConditionalStartPToken({
   //    //       open: toSToken('<[!'),
   //    //       peRef,
   //    //    });
   //    //    setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
   //    //       done({ source: new STokenSource() });

   //    //       deliver(new TextPToken({ text: toSToken('foo') }), () => {});
   //    //    });

   //    //    doExpand([condStart], true, (results) => {
   //    //       // do the timeout to let the text token get passed through
   //    //       setTimeout(() => {
   //    //          const types = results.map((item) => item.type);

   //    //          expect(types).toEqual([CONDITIONAL_START_PTOKEN, TEXT_PTOKEN]);
   //    //          done();
   //    //       }, 0);
   //    //    });
   //    // });

   //    // it('nests multiple INCLUDE conditionals', (done) => {
   //    //    const peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
   //    //    condStart = new ConditionalStartPToken({
   //    //       open: toSToken('<[!'),
   //    //       peRef,
   //    //    });
   //    //    let count = 0;
   //    //    setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
   //    //       done({ source: new STokenSource() });
   //    //       count++;
   //    //       if (count === 1) {
   //    //          deliver(condStart, () => {});
   //    //       }
   //    //    });

   //    //    doExpand([condStart], true, () => {
   //    //       // do the timeout to let the text token get passed through
   //    //       setTimeout(() => {
   //    //          const args = setupConditionalSpy.calls.argsFor(0);

   //    //          expect(args[1].conditionalStack.length).toEqual(2);
   //    //          done();
   //    //       }, 0);
   //    //    });
   //    // });

   //    // it('pases text tokens to the STokenSource', (done) => {
   //    //    const peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
   //    //    condStart = new ConditionalStartPToken({
   //    //       open: toSToken('<[!'),
   //    //       peRef,
   //    //    });
   //    //    let sourceSpy: jasmine.Spy;

   //    //    setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
   //    //       const source = new STokenSource();
   //    //       sourceSpy = spyOn(source, 'addText');
   //    //       done({ source });
   //    //    });

   //    //    doExpand(
   //    //       [condStart, new TextPToken({ text: toSToken('<!ELEMENT foo ANY>') })],
   //    //       true,
   //    //       () => {
   //    //          expect(sourceSpy).toHaveBeenCalledWith('<!ELEMENT foo ANY>');
   //    //          done();
   //    //       },
   //    //    );
   //    // });

   //    // it('a conditional end after a start with a peRef marks the source text as done', (done) => {
   //    //    const peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
   //    //    condStart = new ConditionalStartPToken({
   //    //       open: toSToken('<[!'),
   //    //       peRef,
   //    //    });
   //    //    let sourceSpy: jasmine.Spy;
   //    //    setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
   //    //       const source = new STokenSource();
   //    //       sourceSpy = spyOn(source, 'endText');
   //    //       done({ source });
   //    //    });
   //    //    const entityExpander = new EntityExpander(false, () => {}, {
   //    //       parseBody: (): void => {},
   //    //       parseEntityValue: (): void => {},
   //    //       resolveEntityId: () => '',
   //    //       retrieveExternalEntity,
   //    //       parseAttributeValue,
   //    //    });

   //    //    entityExpander.expandPToken(condStart, () => {
   //    //       const args = setupConditionalSpy.calls.argsFor(0);
   //    //       const stack = args[1].conditionalStack;
   //    //       const topInfo = stack[stack.length - 1];

   //    //       entityExpander.expandPToken(condEnd, () => {});
   //    //       topInfo.textIsFinished();

   //    //       expect(sourceSpy).toHaveBeenCalled();
   //    //       done();
   //    //    });
   //    // });

   //    // it('a conditional end after a start sets up a finished callback which delivers the end', (done) => {
   //    //    const peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
   //    //    condStart = new ConditionalStartPToken({
   //    //       open: toSToken('<[!'),
   //    //       peRef,
   //    //    });

   //    //    setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
   //    //       const source = new STokenSource();
   //    //       done({ source });
   //    //    });
   //    //    const results: Array<ParseToken> = [];
   //    //    const entityExpander = new EntityExpander(false, results.push.bind(results), {
   //    //       parseBody: (): void => {},
   //    //       parseEntityValue: (): void => {},
   //    //       resolveEntityId: () => '',
   //    //       retrieveExternalEntity,
   //    //       parseAttributeValue,
   //    //    });

   //    //    entityExpander.expandPToken(condStart, () => {
   //    //       const args = setupConditionalSpy.calls.argsFor(0);
   //    //       const stack = args[1].conditionalStack;
   //    //       const topInfo = stack[stack.length - 1];

   //    //       entityExpander.expandPToken(condEnd, () => {});
   //    //       topInfo.textIsFinished();

   //    //       const types = results.map((item) => item.type);

   //    //       expect(types).toEqual([CONDITIONAL_START_PTOKEN, CONDITIONAL_END_PTOKEN]);
   //    //       done();
   //    //    });
   //    // });
   // });

   describe('element start', () => {
      let startElement: ElementStartPToken;
      let expandAttributeSpy: jasmine.Spy;

      beforeEach(() => {
         expandAttributeSpy = spyOn(expandAttributes, 'expandAttributes');
         let index = 0;

         startElement = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('student'),
         });

         expandAttributeSpy.and.callFake(
            (
               value: Array<Record<string, any>>,
               params: Record<string, any>,
               stack: EntityContextStack,
               cb: (arg: any) => void,
            ) => {
               const result = value.map(() => {
                  const code = WFEID.XMLDECL_PARAM_UNKNOWN;
                  index++;

                  return {
                     newValue: [new TextPToken({ text: toSToken(`testValue #${index}`) })],
                     byproducts: [new WellFormedError(code, [`${index}`])],
                  };
               });

               cb(result);
            },
         );
      });

      it('passes a the element through with no changes when it has no attributes', (done) => {
         doExpand([startElement], true, (results) => {
            expect(results).toEqual([startElement]);
            done();
         });
      });

      it('returns the expanded general entity references when there is one in the attribute', (done) => {
         const error1 = new WellFormedError(WFEID.XMLDECL_PARAM_UNKNOWN, ['1']);
         const error2 = new WellFormedError(WFEID.XMLDECL_PARAM_UNKNOWN, ['2']);
         const reference1 = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('foo'),
         });
         startElement = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('student'),
            attributes: [
               {
                  name: toSToken('two'),
                  value: [
                     new CharRefPToken({ open: toSToken('&#') }),
                     new TextPToken({ text: toSToken('twoValue') }),
                     reference1,
                  ],
               },
               {
                  name: toSToken('three'),
                  value: [reference1],
               },
            ],
         });
         const expandedStart = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('student'),
            attributes: [
               {
                  name: toSToken('two'),
                  value: [new TextPToken({ text: toSToken('testValue #1') })],
               },
               {
                  name: toSToken('three'),
                  value: [new TextPToken({ text: toSToken('testValue #2') })],
               },
            ],
         });

         doExpand([startElement], true, (results) => {
            expect(results as any).toEqual([error1, error2, expandedStart]); // @@ hack, because of WellFormedError
            done();
         });
      });

      it('calls the expandAttribute() routine with the value, expand params and a callback', (done) => {
         startElement = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('student'),
            attributes: [
               {
                  name: toSToken('two'),
                  value: [new CharRefPToken({ open: toSToken('&#') })],
               },
            ],
         });

         doExpand([startElement], true, () => {
            const callArgs = expandAttributeSpy.calls.mostRecent().args;

            expect(callArgs[0]).toEqual(startElement.attributes);
            expect(callArgs[1].entityDetails).not.toBeUndefined();
            expect(callArgs[2] instanceof EntityContextStack).toEqual(true);
            expect(typeof callArgs[3]).toEqual('function');
            done();
         });
      });
   });

   describe('empty element start', () => {
      let emptyElement: ElementEmptyPToken;

      beforeEach(() => {
         emptyElement = new ElementEmptyPToken({
            open: toSToken('<'),
            name: toSToken('student'),
         });
      });

      it('passes a the element through with no changes when it has no attributes', (done) => {
         const input = [emptyElement];

         doExpand(input, true, (results) => {
            expect(results).toEqual([emptyElement]);
            done();
         });
      });
   });

   describe('entity references', () => {
      let geRef: GeneralEntityReferencePToken;
      let streamParsedReplacementTextSpy: jasmine.Spy;

      beforeEach(() => {
         streamParsedReplacementTextSpy = spyOn(
            streamParsedReplacementText,
            'streamParsedReplacementText',
         );

         geRef = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('root'),
         });
      });

      it('calls the streamParsedReplacementText() function with the ref token, prams and a callback', (done) => {
         streamParsedReplacementTextSpy.and.callFake((token, params, stack, callback) => {
            callback(undefined, () => {});
         });

         doExpand([geRef], true, () => {
            const args = streamParsedReplacementTextSpy.calls.argsFor(0);

            expect(args[0]).toEqual(geRef);
            expect(args[1].entityDetails).not.toBeUndefined();
            expect(args[2] instanceof EntityContextStack).toEqual(true);
            expect(typeof args[3]).toEqual('function');
            done();
         });
      });

      it('returns the geRef if it is not expanded', (done) => {
         streamParsedReplacementTextSpy.and.callFake((token, params, stack, callback) => {
            callback(undefined, () => {});
         });

         doExpand([geRef], true, (results) => {
            expect(harvestTypes(results)).toEqual([geRef.type]);
            done();
         });
      });

      it('returns any intermediate tokens rather than the GE Ref if there are any', (done) => {
         const text = new TextPToken({ text: toSToken('foo') });
         streamParsedReplacementTextSpy.and.callFake((token, params, stack, callback) => {
            callback(text, () => {
               callback(undefined, () => {});
            });
         });

         doExpand([geRef], true, (results) => {
            expect(harvestTypes(results)).toEqual([text.type]);
            done();
         });
      });

      it('does not call expander if already in a GE Ref with the same name (stop recursion) (§4.1.0)', (done) => {
         const geRef2 = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('root'),
         });
         streamParsedReplacementTextSpy.and.callFake((token, params, stack, callback) => {
            stack.pushName(token, '');

            callback(geRef2, () => {
               callback(undefined, () => {});
            });
         });

         doExpand([geRef], true, (results) => {
            expect(streamParsedReplacementTextSpy).toHaveBeenCalledTimes(1);
            expect(harvestTypes(results)).toEqual([geRef2.type]);
            done();
         });
      });

      it('does not call expander if already in a PE Ref with the same name (stop recursion) (§4.1.0)', (done) => {
         const peRef1 = new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('root'),
         });
         const peRef2 = new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('root'),
         });
         streamParsedReplacementTextSpy.and.callFake((token, params, stack, callback) => {
            stack.pushName(token, '');

            if (token === peRef1) {
               callback(peRef2, () => {
                  callback(undefined, () => {});
               });
            }
         });

         doExpand([peRef1], true, (results) => {
            expect(streamParsedReplacementTextSpy).toHaveBeenCalledTimes(1);
            expect(harvestTypes(results)).toEqual([peRef2.type]);
            done();
         });
      });

      it('does not consider a PE Ref and a GE Ref with the same name to be a risk for mutual recursion (§4.1.0)', (done) => {
         // This scenario (a GE inside of a PE) can't happen in an ordinary document. But this processor does not, and should not, care
         const peRef1 = new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('root'),
         });
         const text = new TextPToken({ text: toSToken('foo') });
         streamParsedReplacementTextSpy.and.callFake((token, params, stack, callback) => {
            stack.pushName(token, '');

            if (token === peRef1) {
               callback(geRef, () => {
                  callback(undefined, () => {});
               });
            } else {
               callback(text, () => {
                  callback(undefined, () => {});
               });
            }
         });

         doExpand([peRef1], true, (results) => {
            expect(streamParsedReplacementTextSpy).toHaveBeenCalledTimes(2);
            expect(harvestTypes(results)).toEqual([text.type]);
            done();
         });
      });
   });
});
