/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, EntityKind } from 'basic';
import { WellFormedError } from 'error';
import { defaultExtractors } from 'extractor';
import { PToken, ParseValue, ContextType } from 'pToken';
import { toSToken, STokenSource } from 'sToken';
import {
   CONDITIONAL_PTOKEN,
   CONDITIONAL_CLOSE_PTOKEN,
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ERROR_TYPE,
   INTERNAL_SUBSET_START_TOKEN,
   INTERNAL_SUBSET_END_TOKEN,
   NOTATION_DECLARATION_PTOKEN,
   TEXT_PTOKEN,
   CharRefPToken,
   ConditionalClosePToken,
   ConditionalPToken,
   DocTypeEndPToken,
   DocTypeStartPToken,
   ElementDeclarationPToken,
   ElementStartPToken,
   ElementEmptyPToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   NotationDeclarationPToken,
   ParameterEntityDeclarationPToken,
   TextPToken,
   XmlError,
   AttListPToken,
   ParameterEntityReferencePToken,
   EXTERNAL_ID,
   unassigned,
} from 'token';

import * as assignAttListDeclaration from '../unassigned/assignAttListDeclaration';
import * as assignEntityDeclaration from '../unassigned/assignEntityDeclaration';
import * as assignElementDeclaration from '../unassigned/assignElementDeclaration';
import * as assignNotationDeclaration from '../unassigned/assignNotationDeclaration';
import * as expandAttributes from '../utils/expandAttributes';
import * as expandEntityValueModule from '../utils/expandEntityValue';
import * as expandUnassigned from '../utils/expandUnassigned';
import { EXTERNAL_DTD_PSEUDO_TOKEN } from '../utils/ExternalDtdSubsetPseudoToken';
import * as setupConditional from '../utils/setupConditional';
import * as streamParsedReplacementText from '../utils/streamParsedReplacementText';
import { EntityExpander } from '../EntityExpander';
import { AttributeValueResults, ExpandParams, RetrieveResults } from '../types';
import { EntityNameStack } from '../utils/EntityNameStack';

describe('EntityExpander (unit)', () => {
   let expandUnassignedSpy: jasmine.Spy;
   let setupConditionalSpy: jasmine.Spy;
   let assignAttListSpy: jasmine.Spy;
   let assignEntityDeclSpy: jasmine.Spy;
   let assignNotationDeclSpy: jasmine.Spy;

   beforeEach(() => {
      expandUnassignedSpy = spyOn(expandUnassigned, 'expandUnassigned');
      setupConditionalSpy = spyOn(setupConditional, 'setupConditional');
      assignAttListSpy = spyOn(assignAttListDeclaration, 'assignAttListDeclaration');
      assignNotationDeclSpy = spyOn(assignNotationDeclaration, 'assignNotationDeclaration');
      assignEntityDeclSpy = spyOn(assignEntityDeclaration, 'assignEntityDeclaration');
   });

   function harvestTypes(results: Array<ParseValue>): Array<string> {
      return results.map((element) => element.type);
   }

   function retrieveExternalEntity(): RetrieveResults {
      const sTokenSource = new STokenSource(defaultExtractors, new EntityMetaData());

      return {
         sTokenSource,
         getErrors(): Array<XmlError> {
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
      tokens: Array<ParseValue>,
      validate: boolean,
      allDone: (results: Array<ParseValue>) => void,
   ): void {
      const results: Array<ParseValue> = [];
      const unsent = tokens.slice(0);

      const entityExpander = new EntityExpander(validate, results.push.bind(results), {
         parseBody: (): void => {},
         parseEntityValue: (): void => {},
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

   describe('EntityMetaData', () => {
      let emd: EntityMetaData;

      beforeEach(() => {
         emd = new EntityMetaData();
      });

      it('passes the EntityMetaData instance through', (done) => {
         doExpand([emd], true, (results) => {
            expect(results).toEqual([emd]);
            done();
         });
      });

      it('swallows subsequent entity meta data tokens', (done) => {
         const emd2 = new EntityMetaData(EntityKind.EXTERNAL);

         doExpand([emd, emd2], true, (results) => {
            expect(results).toEqual([emd]);
            done();
         });
      });

      it('passes the EntityMetaData to the utility functions in the expandParams', (done) => {
         const expandAttributeSpy: jasmine.Spy = spyOn(expandAttributes, 'expandAttributes');
         expandAttributeSpy.and.callFake((value, params, stack, cb) => {
            cb([
               {
                  newValue: [],
                  byproducts: [],
               },
            ]);
         });
         const startElement = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('student'),
            attributes: [
               {
                  name: toSToken('two'),
                  value: [new CharRefPToken({ open: toSToken('&#') })],
               },
            ],
         });

         doExpand([emd, startElement], true, () => {
            expect(expandAttributeSpy.calls.argsFor(0)[1].emd).toEqual(emd);
            done();
         });
      });
   });

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

      it('adds an internal subset markers when there is an internal subset that is empty', (done) => {
         docTypeStart = new DocTypeStartPToken({
            open: toSToken('<!'),
            name: toSToken('root'),
            openSubset: toSToken('['),
         });

         doExpand([docTypeStart, docTypeEnd], true, (results) => {
            expect(harvestTypes(results)).toEqual([
               DOCTYPE_START_PTOKEN,
               INTERNAL_SUBSET_START_TOKEN,
               INTERNAL_SUBSET_END_TOKEN,
               DOCTYPE_END_PTOKEN,
            ]);
            done();
         });
      });

      it('adds an internal subset markers when there is a non-empty internal', (done) => {
         docTypeStart = new DocTypeStartPToken({
            open: toSToken('<!'),
            name: toSToken('root'),
            openSubset: toSToken('['),
         });
         const notation = new NotationDeclarationPToken({ open: toSToken('<!') });

         doExpand([docTypeStart, notation, docTypeEnd], true, (results) => {
            expect(harvestTypes(results)).toEqual([
               DOCTYPE_START_PTOKEN,
               INTERNAL_SUBSET_START_TOKEN,
               NOTATION_DECLARATION_PTOKEN,
               INTERNAL_SUBSET_END_TOKEN,
               DOCTYPE_END_PTOKEN,
            ]);
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
         streamParsedReplacementTextSpy.and.callFake((token, params, callback) => {
            callback(undefined, () => {});
         });

         doExpand([docTypeStart, docTypeEnd], true, () => {
            const args = streamParsedReplacementTextSpy.calls.argsFor(0);

            expect(args[0].type).toEqual(EXTERNAL_DTD_PSEUDO_TOKEN);
            expect(args[1].entityDetails).not.toBeUndefined();
            expect(args[2]).toBeInstanceOf(Function);
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
         streamParsedReplacementTextSpy.and.callFake((token, params, callback) => {
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
         const error = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, ['x']);
         streamParsedReplacementTextSpy.and.callFake((token, params, callback) => {
            callback(error, () => {
               callback(undefined, () => {});
            });
         });

         doExpand([docTypeStart, notation, docTypeEnd], true, (results) => {
            expect(harvestTypes(results)).toEqual([
               DOCTYPE_START_PTOKEN,
               INTERNAL_SUBSET_START_TOKEN,
               NOTATION_DECLARATION_PTOKEN,
               INTERNAL_SUBSET_END_TOKEN,
               ERROR_TYPE,
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
               INTERNAL_SUBSET_START_TOKEN,
               NOTATION_DECLARATION_PTOKEN,
               INTERNAL_SUBSET_END_TOKEN,
               DOCTYPE_END_PTOKEN,
            ]);
            done();
         });
      });

      describe('with incomplete conditional sections', () => {
         it('delivers doctype start, conditional section starts in the internal subset, and then doctype end', (done) => {
            const condStart = new ConditionalPToken({ open: toSToken('<![') });
            docTypeStart = new DocTypeStartPToken({
               open: toSToken('<!'),
               name: toSToken('root'),
               openSubset: toSToken('['),
            });

            doExpand([docTypeStart, condStart, condStart, docTypeEnd], false, (results) => {
               expect(harvestTypes(results)).toEqual([
                  DOCTYPE_START_PTOKEN,
                  INTERNAL_SUBSET_START_TOKEN,
                  CONDITIONAL_PTOKEN,
                  CONDITIONAL_PTOKEN,
                  INTERNAL_SUBSET_END_TOKEN,
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
            const condStart = new ConditionalPToken({ open: toSToken('<![') });
            docTypeStart = new DocTypeStartPToken({
               open: toSToken('<!'),
               name: toSToken('root'),
               externalId: {
                  system: {
                     value: [new TextPToken({ text: toSToken('systemFoo') })],
                  },
               },
            });
            streamParsedReplacementTextSpy.and.callFake((token, params, cb) => {
               cb(condStart, () => {});
               cb(condStart, () => {});
               cb(undefined, () => {});
            });

            doExpand([docTypeStart, docTypeEnd], true, (results) => {
               expect(harvestTypes(results)).toEqual([
                  DOCTYPE_START_PTOKEN,
                  CONDITIONAL_PTOKEN,
                  CONDITIONAL_PTOKEN,
                  DOCTYPE_END_PTOKEN,
               ]);
               done();
            });
         });

         it('delivers doctype start, with conditional sections with perefs, and then doctype end', (done) => {
            const condStart = new ConditionalPToken({ open: toSToken('<![') });
            const condStartWithRf = new ConditionalPToken({
               open: toSToken('<!['),
               peRef: new ParameterEntityReferencePToken({ open: toSToken('%') }),
            });
            docTypeStart = new DocTypeStartPToken({
               open: toSToken('<!'),
               name: toSToken('root'),
               openSubset: toSToken('['),
            });
            setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
               done({
                  source: new STokenSource(defaultExtractors, new EntityMetaData()),
               });
            });
            const results: Array<ParseValue> = [];
            const entityExpander = new EntityExpander(false, results.push.bind(results), {
               parseBody: (): void => {},
               parseEntityValue: (): void => {},
               retrieveExternalEntity,
               parseAttributeValue,
            });

            entityExpander.expandPToken(docTypeStart, () => {});
            entityExpander.expandPToken(condStart, () => {});
            entityExpander.expandPToken(condStartWithRf, () => {});
            entityExpander.expandPToken(condStart, () => {
               const args = setupConditionalSpy.calls.argsFor(0);
               const stack = args[1].conditionalStack;
               const topInfo = stack[stack.length - 1];

               entityExpander.expandPToken(docTypeEnd, () => {});
               delete topInfo.source;
               topInfo.textIsFinished();

               expect(harvestTypes(results)).toEqual([
                  DOCTYPE_START_PTOKEN,
                  INTERNAL_SUBSET_START_TOKEN,
                  CONDITIONAL_PTOKEN,
                  CONDITIONAL_PTOKEN,
                  CONDITIONAL_PTOKEN,
                  INTERNAL_SUBSET_END_TOKEN,
                  DOCTYPE_END_PTOKEN,
               ]);
               done();
            });
         });
      });
   });

   describe('declarations', () => {
      let notation: NotationDeclarationPToken;

      beforeEach(() => {
         notation = new NotationDeclarationPToken({
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: toSToken('<!'),
            name: toSToken('test'),
            externalId: {
               type: EXTERNAL_ID,
            },
         });
      });

      it('passes a declaration with unassigned values through', (done) => {
         const one = unassigned.wordFromSToken(toSToken('1'));
         const two = unassigned.wordFromSToken(toSToken('2'));
         notation.unassigned = [one];

         expandUnassignedSpy.and.callFake((unassigned, params, chain, isElement, callback) => {
            callback({ newValue: [two], byproducts: [] });
         });

         doExpand([notation], true, (results) => {
            expect(results).toEqual([notation]);
            done();
         });
      });

      it('passes a declaration with unassigned values to the expandUnassigned() utility', (done) => {
         const one = unassigned.wordFromSToken(toSToken('1'));
         notation.unassigned = [one];

         expandUnassignedSpy.and.callFake((unassigned, params, chain, isElement, callback) => {
            callback({ newValue: [], byproducts: [] });
         });

         doExpand([notation], true, () => {
            const params = expandUnassignedSpy.calls.argsFor(0);

            expect(params[0]).toEqual([one]);
            expect(params[1].entityDetails).not.toBeUndefined();
            expect(params[2]).toBeInstanceOf(EntityNameStack);
            expect(params[3]).toEqual(false);
            expect(params[4]).toBeInstanceOf(Function);
            done();
         });
      });

      it('delivers any errors encountered while expanding the unassigned', (done) => {
         const one = unassigned.wordFromSToken(toSToken('1'));
         const two = unassigned.wordFromSToken(toSToken('2'));
         notation.unassigned = [one];
         const error = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, ['x']);

         expandUnassignedSpy.and.callFake((unassigned, params, chain, isElement, callback) => {
            callback({ newValue: [two], byproducts: [error] });
         });

         doExpand([notation], true, (results) => {
            expect(harvestTypes(results)).toEqual([ERROR_TYPE, NOTATION_DECLARATION_PTOKEN]);
            done();
         });
      });
   });

   describe('NOTATION declaration', () => {
      let notation: NotationDeclarationPToken;

      beforeEach(() => {
         notation = new NotationDeclarationPToken({
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: toSToken('<!'),
            name: toSToken('test'),
            externalId: {
               type: EXTERNAL_ID,
            },
         });
      });

      it('passes a declaration with no unassigned values through without changes', (done) => {
         doExpand([notation], true, (results) => {
            expect(results).toEqual([notation]);
            done();
         });
      });

      it('asks the notation to assign any newly unassigned values to itself', (done) => {
         const one = unassigned.wordFromSToken(toSToken('1'));
         const two = unassigned.wordFromSToken(toSToken('2'));
         notation.unassigned = [one];

         expandUnassignedSpy.and.callFake((unassigned, params, chain, isElement, callback) => {
            callback({ newValue: [two], byproducts: [] });
         });

         doExpand([notation], true, () => {
            expect(assignNotationDeclSpy).toHaveBeenCalled();
            expect(notation.unassigned).toEqual([two]);
            done();
         });
      });
   });

   describe('ELEMENT declaration', () => {
      let elementDecl: ElementDeclarationPToken;

      beforeEach(() => {
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
         const one = unassigned.wordFromSToken(toSToken('1'));
         const two = unassigned.wordFromSToken(toSToken('2'));
         elementDecl.unassigned = [one];
         spyOn(assignElementDeclaration, 'assignElementDeclaration');

         expandUnassignedSpy.and.callFake((unassigned, params, chain, isElement, callback) => {
            callback({ newValue: [two], byproducts: [] });
         });

         doExpand([elementDecl], true, () => {
            expect(assignElementDeclaration.assignElementDeclaration).toHaveBeenCalled();
            done();
         });
      });

      it('passes tells expandUnassigned to treat this as an element for parsing purposes', (done) => {
         const one = unassigned.wordFromSToken(toSToken('1'));
         elementDecl.unassigned = [one];
         spyOn(assignElementDeclaration, 'assignElementDeclaration');

         expandUnassignedSpy.and.callFake((unassigned, params, chain, isElement, callback) => {
            callback({ newValue: [], byproducts: [] });
         });

         doExpand([elementDecl], true, () => {
            const params = expandUnassignedSpy.calls.argsFor(0);

            expect(params[3]).toEqual(true);
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
            (value: Array<object>, params: object, stack: EntityNameStack, cb: Function) => {
               const result = value.map(() => {
                  const code = WellFormedError.ID.XMLDECL_PARAM_UNKNOWN;
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
         const attList = new AttListPToken({
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
         const error1 = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, ['1']);
         const error2 = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, ['2']);
         const expanded = new AttListPToken({
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
            expect(results).toEqual([error1, error2, expanded]);
            done();
         });
      });

      it('calls the expandAttributes() routine with the attDefs, expand params and a callback', (done) => {
         const attList = new AttListPToken({
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
            expect(callArgs[1].emd).not.toBeUndefined();
            expect(callArgs[2]).toBeInstanceOf(EntityNameStack);
            expect(callArgs[3]).toBeInstanceOf(Function);
            done();
         });
      });

      it('asks the AttListPToken to assign any newly unassigned values to itself', (done) => {
         const one = unassigned.wordFromSToken(toSToken('1'));
         const two = unassigned.wordFromSToken(toSToken('2'));
         const attList = new AttListPToken({
            open: toSToken('<!'),
            elementName: toSToken('student'),
            attDefs: [],
            unassigned: [one],
         });

         expandUnassignedSpy.and.callFake((unassigned, params, chain, isElement, callback) => {
            callback({ newValue: [two], byproducts: [] });
         });

         doExpand([attList], true, () => {
            expect(assignAttListSpy).toHaveBeenCalled();
            expect(attList.unassigned).toEqual([two]);
            done();
         });
      });
   });

   describe('ENTITY declaration', () => {
      let geDecl: GeneralEntityDeclarationPToken;
      let peDecl: ParameterEntityDeclarationPToken;
      let expandEntityValueSpy: jasmine.Spy;

      beforeEach(() => {
         expandEntityValueSpy = spyOn(expandEntityValueModule, 'expandEntityValue');
         let index = 0;

         expandEntityValueSpy.and.callFake((pToken, params, chain, cb: Function) => {
            const error = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, [
               `${index}`,
            ]);
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
            expect(args[2]).toBeInstanceOf(EntityNameStack);
            expect(args[3]).toBeInstanceOf(Function);
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
            expect(args[2].hasPEName('student')).toEqual(true);
            expect(args[3]).toBeInstanceOf(Function);
            done();
         });
      });

      it('delivers the geDecl along with any errors that happened while expanding its value', (done) => {
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });
         const error1 = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, ['0']);

         doExpand([geDecl], true, (results) => {
            expect(results).toEqual([error1, geDecl]);
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
            cb({ newValue: [new TextPToken({ text: toSToken(`testValue`) })], byproducts: [] });
         });

         doExpand([geDecl, geDecl], true, () => {
            expect(hasGeDecl).toEqual(false);
            expect(afterCallParams.entityDetails.hasEntity(geDecl)).toEqual(true);
            done();
         });
      });

      it('asks the entity declaration to assign any newly unassigned values to itself', (done) => {
         const one = unassigned.wordFromSToken(toSToken('1'));
         const two = unassigned.wordFromSToken(toSToken('2'));
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
            unassigned: [one],
         });

         expandUnassignedSpy.and.callFake((unassigned, params, chain, isElement, callback) => {
            callback({ newValue: [two], byproducts: [] });
         });

         doExpand([geDecl], true, () => {
            expect(assignEntityDeclSpy).toHaveBeenCalled();
            expect(geDecl.unassigned).toEqual([two]);
            done();
         });
      });
   });

   describe('conditional sections', () => {
      let condStart: ConditionalPToken;
      let condEnd: ConditionalClosePToken;

      beforeEach(() => {
         condEnd = new ConditionalClosePToken({
            open: toSToken(']]>'),
         });
      });

      it('passes all contents of an ignore conditional section through unchanged', (done) => {
         condStart = new ConditionalPToken({
            open: toSToken('<[!'),
            sectionType: toSToken('IGNORE'),
         });

         doExpand([condStart, new TextPToken('foo'), condEnd], true, (results) => {
            const types = results.map((item) => item.type);

            expect(types).toEqual([CONDITIONAL_PTOKEN, TEXT_PTOKEN, CONDITIONAL_CLOSE_PTOKEN]);
            done();
         });
      });

      it('passes all contents of an unknown conditional section through unchanged', (done) => {
         condStart = new ConditionalPToken({
            open: toSToken('<[!'),
            sectionType: toSToken('OOPSIE'),
         });

         doExpand([condStart, new TextPToken('foo'), condEnd], true, (results) => {
            const types = results.map((item) => item.type);

            expect(types).toEqual([CONDITIONAL_PTOKEN, TEXT_PTOKEN, CONDITIONAL_CLOSE_PTOKEN]);
            done();
         });
      });

      it('passes all contents of an include conditional section through unchanged', (done) => {
         condStart = new ConditionalPToken({
            open: toSToken('<[!'),
            sectionType: toSToken('INCLUDE'),
         });

         doExpand([condStart, new TextPToken('foo'), condEnd], true, (results) => {
            const types = results.map((item) => item.type);

            expect(types).toEqual([CONDITIONAL_PTOKEN, TEXT_PTOKEN, CONDITIONAL_CLOSE_PTOKEN]);
            done();
         });
      });

      it('passes all contents of an include conditional section through unchanged', (done) => {
         condStart = new ConditionalPToken({
            open: toSToken('<[!'),
            sectionType: toSToken('INCLUDE'),
         });

         doExpand([condStart, new TextPToken('foo'), condEnd], true, (results) => {
            const types = results.map((item) => item.type);

            expect(types).toEqual([CONDITIONAL_PTOKEN, TEXT_PTOKEN, CONDITIONAL_CLOSE_PTOKEN]);
            done();
         });
      });

      it('passes a peRef and other parameters to setupConditional() when the peRef is present', (done) => {
         const peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
         condStart = new ConditionalPToken({
            open: toSToken('<[!'),
            peRef,
         });
         setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
            done({
               sectionType: toSToken('IGNORE'),
            });
         });

         doExpand([condStart], true, () => {
            const args = setupConditionalSpy.calls.argsFor(0);
            expect(args[0]).toEqual(peRef);
            expect(args[1].utils).not.toBeUndefined(); // inner awareness
            expect(args[2]).toBeInstanceOf(EntityNameStack);
            expect(args[3]).toEqual(ContextType.PARAMETER_ENTITY);
            expect(args[4]).toBeInstanceOf(Function);
            expect(args[5]).toBeInstanceOf(Function);
            done();
         });
      });

      it('creates a new conditional start with the expanded section type added', (done) => {
         const peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
         condStart = new ConditionalPToken({
            open: toSToken('<[!'),
            peRef,
         });
         setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
            done({
               sectionType: toSToken(' FOO'),
            });
         });

         doExpand([condStart], true, (results) => {
            expect(results[0]).not.toBe(condStart);
            expect(results[0]).toEqualRangeless({
               open: toSToken('<[!'),
               peRef,
               sectionType: toSToken(' FOO'),
            });
            done();
         });
      });

      it('adds to the conditional stack with the value from setupConditional()', (done) => {
         const peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
         condStart = new ConditionalPToken({
            open: toSToken('<[!'),
            peRef,
         });
         setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
            done({ source: true });
         });

         doExpand([condStart], true, () => {
            const args = setupConditionalSpy.calls.argsFor(0);

            expect(args[1].conditionalStack[0]).toEqual({ source: true });
            done();
         });
      });

      it('pases text tokens from the expanded conditional without modification', (done) => {
         const peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
         condStart = new ConditionalPToken({
            open: toSToken('<[!'),
            peRef,
         });
         setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
            done({ source: new STokenSource(defaultExtractors, new EntityMetaData()) });

            deliver(new TextPToken({ text: toSToken('foo') }), () => {});
         });

         doExpand([condStart], true, (results) => {
            // do the timeout to let the text token get passed through
            setTimeout(() => {
               const types = results.map((item) => item.type);

               expect(types).toEqual([CONDITIONAL_PTOKEN, TEXT_PTOKEN]);
               done();
            }, 0);
         });
      });

      it('nests multiple INCLUDE conditionals', (done) => {
         const peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
         condStart = new ConditionalPToken({
            open: toSToken('<[!'),
            peRef,
         });
         let count = 0;
         setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
            done({ source: new STokenSource(defaultExtractors, new EntityMetaData()) });
            count++;
            if (count === 1) {
               deliver(condStart, () => {});
            }
         });

         doExpand([condStart], true, () => {
            // do the timeout to let the text token get passed through
            setTimeout(() => {
               const args = setupConditionalSpy.calls.argsFor(0);

               expect(args[1].conditionalStack.length).toEqual(2);
               done();
            }, 0);
         });
      });

      it('pases text tokens to the STokenSource', (done) => {
         const peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
         condStart = new ConditionalPToken({
            open: toSToken('<[!'),
            peRef,
         });
         let sourceSpy: jasmine.Spy;

         setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
            const source = new STokenSource(defaultExtractors, new EntityMetaData());
            sourceSpy = spyOn(source, 'addText');
            done({ source });
         });

         doExpand(
            [condStart, new TextPToken({ text: toSToken('<!ELEMENT foo ANY>') })],
            true,
            () => {
               expect(sourceSpy).toHaveBeenCalledWith('<!ELEMENT foo ANY>');
               done();
            },
         );
      });

      it('a conditional end after a start with a peRef marks the source text as done', (done) => {
         const peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
         condStart = new ConditionalPToken({
            open: toSToken('<[!'),
            peRef,
         });
         let sourceSpy: jasmine.Spy;
         setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
            const source = new STokenSource(defaultExtractors, new EntityMetaData());
            sourceSpy = spyOn(source, 'endText');
            done({ source });
         });
         const entityExpander = new EntityExpander(false, () => {}, {
            parseBody: (): void => {},
            parseEntityValue: (): void => {},
            retrieveExternalEntity,
            parseAttributeValue,
         });

         entityExpander.expandPToken(condStart, () => {
            const args = setupConditionalSpy.calls.argsFor(0);
            const stack = args[1].conditionalStack;
            const topInfo = stack[stack.length - 1];

            entityExpander.expandPToken(condEnd, () => {});
            topInfo.textIsFinished();

            expect(sourceSpy).toHaveBeenCalled();
            done();
         });
      });

      it('a conditional end after a start sets up a finished callback which delivers the end', (done) => {
         const peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
         condStart = new ConditionalPToken({
            open: toSToken('<[!'),
            peRef,
         });

         setupConditionalSpy.and.callFake((peref, params, stack, incontent, deliver, done) => {
            const source = new STokenSource(defaultExtractors, new EntityMetaData());
            done({ source });
         });
         const results: Array<ParseValue> = [];
         const entityExpander = new EntityExpander(false, results.push.bind(results), {
            parseBody: (): void => {},
            parseEntityValue: (): void => {},
            retrieveExternalEntity,
            parseAttributeValue,
         });

         entityExpander.expandPToken(condStart, () => {
            const args = setupConditionalSpy.calls.argsFor(0);
            const stack = args[1].conditionalStack;
            const topInfo = stack[stack.length - 1];

            entityExpander.expandPToken(condEnd, () => {});
            topInfo.textIsFinished();

            const types = results.map((item) => item.type);

            expect(types).toEqual([CONDITIONAL_PTOKEN, CONDITIONAL_CLOSE_PTOKEN]);
            done();
         });
      });
   });

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
            (value: Array<object>, params: object, stack: EntityNameStack, cb: Function) => {
               const result = value.map(() => {
                  const code = WellFormedError.ID.XMLDECL_PARAM_UNKNOWN;
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
         const error1 = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, ['1']);
         const error2 = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, ['2']);
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
            expect(results).toEqual([error1, error2, expandedStart]);
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
            expect(callArgs[2]).toBeInstanceOf(EntityNameStack);
            expect(callArgs[3]).toBeInstanceOf(Function);
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
         streamParsedReplacementTextSpy.and.callFake((token, params, callback) => {
            callback(undefined, () => {});
         });

         doExpand([geRef], true, () => {
            const args = streamParsedReplacementTextSpy.calls.argsFor(0);

            expect(args[0]).toEqual(geRef);
            expect(args[1].entityDetails).not.toBeUndefined();
            expect(args[2]).toBeInstanceOf(Function);
            done();
         });
      });

      it('returns the geRef if it is not expanded', (done) => {
         streamParsedReplacementTextSpy.and.callFake((token, params, callback) => {
            callback(undefined, () => {});
         });

         doExpand([geRef], true, (results) => {
            expect(harvestTypes(results)).toEqual([geRef.type]);
            done();
         });
      });

      it('returns any intermediate tokens rather than the GE Ref if there are any', (done) => {
         const text = new TextPToken({ text: toSToken('foo') });
         streamParsedReplacementTextSpy.and.callFake((token, params, callback) => {
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
         streamParsedReplacementTextSpy.and.callFake((token, params, callback) => {
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
         streamParsedReplacementTextSpy.and.callFake((token, params, callback) => {
            callback(peRef2, () => {
               callback(undefined, () => {});
            });
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
         streamParsedReplacementTextSpy.and.callFake((token, params, callback) => {
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
