/* Copyright ® 2018 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { Token, EntityMetaData } from "basic";
import { SToken, STokenSource } from "sToken";
import {
   GeneralEntityReferencePToken,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   GENERAL_ENTITY_START_PTOKEN,
   GENERAL_ENTITY_END_PTOKEN,
   ParameterEntityReferencePToken,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,

   elementStart,
   text,
   charRef,
   unassigned,
   notationDeclaration,
   ParameterEntityStartPToken,
   ParameterEntityEndPToken,
   GeneralEntityStartPToken,
   GeneralEntityEndPToken,
} from "token";
import { GeneralEntityDeclarationPToken, ExpandedLiteralValuePToken, ParameterEntityDeclarationPToken } from "source/token/entityDeclaration"; // @@@ TEMP

import { EntityExpander, ExpandToken } from "../EntityExpander";

import { TextPToken, TEXT_PTOKEN } from "source/token/text";
import { PTokenStream, PTokenFromLiteralStream } from "pTokenStream";
import { ExternalId } from "source/token/common/externalId";
import { defaultExtractors } from "extractor";
import { AttListPToken } from "source/token/attListDeclaration";
import { NotationDeclarationPToken } from "source/token/notationDeclaration";
import { UnassignedType } from "source/token/common/unassigned";
import { CharRefPToken } from "source/token/charRef";

describe('EntityExpander (unit)', () => {
   const externalMap: { [publicName: string]: string} = {};

   function makeContentHandler(sTokenSource: STokenSource, writeToken: ExpandToken, done: () => void) {
      const pTokenStream = new PTokenStream(sTokenSource);

      pTokenStream.on('data', (token: Token) => {
         pTokenStream.pause();
         writeToken(token, () => {
            pTokenStream.resume();
         });
      });
      pTokenStream.on('end', () => {
         done();
      });
   }

   function processForEntityValue(sTokenSource: STokenSource, done: (result: ExpandedLiteralValuePToken) => void) {
      const pTokenStream = new PTokenFromLiteralStream(sTokenSource, { peRef: true });
      const results: ExpandedLiteralValuePToken = []

      pTokenStream.on('data', (token: Token) => {
         results.push(token as any);
      });
      pTokenStream.on('end', () => {
         done(results);
      });
   }

   function retrieveExternalEntity(externalId: ExternalId, entityMetaData: EntityMetaData) {
      const sTokenSource = new STokenSource(defaultExtractors, entityMetaData);

      const str = externalMap[(externalId.public!.value[0] as any).text.str];
      sTokenSource.addText(str);
      sTokenSource.endText();

      return sTokenSource;
   }

   function doExpand(validate: boolean, tokens: Array<Token>, allDone: (results: Array<Token>) => void) {
      const results: Array<Token> = [];
      const unsent = tokens.slice(0);
      const entityExpander = new EntityExpander(validate, pushToken, {
         processBody: makeContentHandler,
         processForEntityValue,
         retrieveExternalEntity,
      });

      function pushToken(result: Token | void): boolean {
         if (result) {
            results.push(result);
         }

         return true;
      }

      function processNextToken() {
         if (unsent.length === 0) {
            allDone(results);

            return;
         }

         const nextToken = unsent[0];
         unsent.shift();

         entityExpander.expandToken(nextToken, processNextToken);
      }

      processNextToken();
   }

   describe('ATTLIST declaration', () => {

      it('does not change the value if it contains no general entity references', (done) => {
         const input = [
            new AttListPToken({
               attDefs: [{
                  value: [
                     new text.PToken({ text: SToken.fromString('foo') }),
                  ]
               }],
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[0] as any).attDefs[0].value).toEqual([ new text.PToken({ text: SToken.fromString('foo') }) ]);
            done();
         });
      });

      it('replaces general entity references with their values', (done) => {
         const refToPe = new ParameterEntityReferencePToken({
            open: SToken.fromString('&'),
            name: SToken.fromString('pe'),
         });
         const refToGe = new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
            name: SToken.fromString('ge'),
         });

         const input = [
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe'),
               value: [
                  new text.PToken({ text: SToken.fromString('pe') }),
               ],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('ge'),
               value: [
                  new text.PToken({ text: SToken.fromString('ge') }),
                  refToPe
               ],
            }),
            new AttListPToken({
               attDefs: [{
                  value: [
                     new text.PToken({ text: SToken.fromString('foo') }),
                     refToGe,
                  ]
               }],
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[2] as any).attDefs[0].value).toEqual([
               new text.PToken({ text: SToken.fromString('foo') }),
               new GeneralEntityStartPToken(refToGe),
               new text.PToken({ text: SToken.fromString('ge') }),
               new ParameterEntityStartPToken(refToPe),
               new text.PToken({ text: SToken.fromString('pe') }),
               new ParameterEntityEndPToken(refToPe),
               new GeneralEntityEndPToken(refToGe),
            ]);
            done();
         });
      });

      it('does not replace a reference if it has no name', (done) => {
         const refToGe = new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
         });

         const input = [
            new AttListPToken({
               attDefs: [{
                  value: [
                     new text.PToken({ text: SToken.fromString('foo') }),
                     refToGe,
                  ]
               }],
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[0] as any).attDefs[0].value).toEqual([
               new text.PToken({ text: SToken.fromString('foo') }),
               refToGe,
            ]);
            done();
         });
      });

   });

   describe('entity declaration', () => {

      it('ignores the declaration if it has no name (whitebox)', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               value: [],
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(1);
            expect(results[0].type).toEqual(GENERAL_ENTITY_DECLARATION_PTOKEN);
            done();
         });
      });

      it('ignores a second declaration with the same name (whitebox)', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               value: [],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               value: [],
            })
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(2);
            expect(results[0].type).toEqual(GENERAL_ENTITY_DECLARATION_PTOKEN);
            expect(results[1].type).toEqual(GENERAL_ENTITY_DECLARATION_PTOKEN);
            done();
         });
      });

      it('does not change the value if it contains no parameter entity references', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               value: [
                  new text.PToken({ text: SToken.fromString('foo') }),
               ],
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[0] as any).value).toEqual([ new text.PToken({ text: SToken.fromString('foo') }) ]);
            done();
         });
      });

      it('replaces parameter entity references with their values, if the parameter entities are internally declared', (done) => {
         const refToPe1 = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            name: SToken.fromString('pe1'),
         });
         const refToPe2 = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            name: SToken.fromString('pe2'),
         });

         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe1'),
               value: [
                  new text.PToken({ text: SToken.fromString('pe1') }),
               ],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe2'),
               value: [
                  new text.PToken({ text: SToken.fromString('pe2') }),
                  refToPe1
               ],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               value: [
                  refToPe1,
                  new text.PToken({ text: SToken.fromString('foo') }),
                  refToPe2,
               ],
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[2] as any).value).toEqual([
               new ParameterEntityStartPToken(refToPe1),
               new text.PToken({ text: SToken.fromString('pe1') }),
               new ParameterEntityEndPToken(refToPe1),
               new text.PToken({ text: SToken.fromString('foo') }),
               new ParameterEntityStartPToken(refToPe2),
               new text.PToken({ text: SToken.fromString('pe2') }),
               new ParameterEntityStartPToken(refToPe1),
               new text.PToken({ text: SToken.fromString('pe1') }),
               new ParameterEntityEndPToken(refToPe1),
               new ParameterEntityEndPToken(refToPe2),
            ]);
            done();
         });
      });

      it('replaces parameter entity references with their values, if the parameter entities are externally declared', (done) => {
         const refToPe1 = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            name: SToken.fromString('pe1'),
         });
         const secondRefToPe1 = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            openSpace: undefined,
            name: SToken.fromString('pe1'),
            nameSpace: undefined,
            close: SToken.fromString(';'),
         });
         const refToPe2 = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            name: SToken.fromString('pe2'),
         });
         externalMap.publicFoo = 'external value %pe1;';

         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe1'),
               value: [
                  new text.PToken({ text: SToken.fromString('pe1') }),
               ],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe2'),
               externalId: {
                  public: {
                     value: [ new text.PToken({ text: SToken.fromString('publicFoo') }), ],
                  }
               },
               value: [],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               value: [
                  refToPe1,
                  new text.PToken({ text: SToken.fromString('foo') }),
                  refToPe2,
               ],
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[2] as any).value).toEqualRangeless([
               new ParameterEntityStartPToken(refToPe1),
               new text.PToken({ text: SToken.fromString('pe1') }),
               new ParameterEntityEndPToken(refToPe1),
               new text.PToken({ text: SToken.fromString('foo') }),
               new ParameterEntityStartPToken(refToPe2),
               new text.PToken({ text: SToken.fromString('external value ') }),
               new ParameterEntityStartPToken(secondRefToPe1),
               new text.PToken({ text: SToken.fromString('pe1') }),
               new ParameterEntityEndPToken(secondRefToPe1),
               new ParameterEntityEndPToken(refToPe2),
            ]);
            done();
         });
      });

      it('does not replace a reference if it has no name', (done) => {
         const refToPe1 = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
         });

         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe1'),
               value: [
                  new text.PToken({ text: SToken.fromString('pe1') }),
               ],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe2'),
               value: [
                  refToPe1
               ],
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[1] as any).value).toEqual([
               refToPe1,
            ]);
            done();
         });
      });

   });

   describe('notation declaration', () => {

      it('passes a declaration with no unassigned values through without changes', (done) => {
         const input = [
            new NotationDeclarationPToken({
               name: SToken.fromString('test'),
               externalId: {
               },
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(1);
            expect(results[0]).toEqual(new NotationDeclarationPToken({
               name: SToken.fromString('test'),
               externalId: {
               },
            }));
            done();
         });
      });

      it('passes a declaration with an unassigned value through', (done) => {
         const unassignedVals = [ unassigned.wordFromSToken(SToken.fromString('public')) ];
         const input = [
            new NotationDeclarationPToken({
               name: SToken.fromString('test'),
               unassigned: unassignedVals,
               externalId: {
                  nextParamName: 'idType',
                  unassigned: unassignedVals,
               },
            }),
         ];

         spyOn(notationDeclaration, 'assignUnassigned').and.callFake((pToken: NotationDeclarationPToken) => {
            expect(pToken.unassigned).toEqual([
               unassigned.wordFromSToken(SToken.fromString('public')),
            ]);
         });

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(1);
            done();
         });
      });

      it('expands a parameter entity reference before assigning unassigned values', (done) => {
         const refToPe1 = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            name: SToken.fromString('pe1'),
         });

         const unassignedVals = [ {
            type: UnassignedType.REFERENCE,
            token: refToPe1,
         } ];
         const input = [
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe1'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('80') }),
                  new text.PToken({ text: SToken.fromString('UBLIC') }),
               ],
            }),
            new NotationDeclarationPToken({
               name: SToken.fromString('test'),
               unassigned: unassignedVals,
               externalId: {
                  nextParamName: 'idType',
                  unassigned: unassignedVals,
               },
            }),
         ];

         spyOn(notationDeclaration, 'assignUnassigned').and.callFake((pToken: NotationDeclarationPToken) => {
            expect(pToken.unassigned).toEqualRangeless([
               unassigned.wordFromSToken(SToken.fromString('PUBLIC')),
            ]);
         });

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(2);
            done();
         });
      });

      it('expands a parameter entity reference that references another', (done) => {
         const refToPe1 = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            name: SToken.fromString('pe1'),
         });

         const unassignedVals = [ {
            type: UnassignedType.REFERENCE,
            token: refToPe1,
         } ];
         const input = [
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe2'),
               value: [
                  new text.PToken({ text: SToken.fromString('C') }),
               ],
            }),
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe1'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('80') }),
                  new text.PToken({ text: SToken.fromString('UBLI') }),
                  new ParameterEntityReferencePToken({
                     open: SToken.fromString('%'),
                     name: SToken.fromString('pe2'),
                  }),
               ],
            }),
            new NotationDeclarationPToken({
               name: SToken.fromString('test'),
               unassigned: unassignedVals,
               externalId: {
                  nextParamName: 'idType',
                  unassigned: unassignedVals,
               },
            }),
         ];

         spyOn(notationDeclaration, 'assignUnassigned').and.callFake((pToken: NotationDeclarationPToken) => {
            expect(pToken.unassigned).toEqualRangeless([
               unassigned.wordFromSToken(SToken.fromString('PUBLIC')),
            ]);
         });

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(3);
            done();
         });
      });

   });

   describe('element start', () => {

      it('does not change the value if it contains no general entity references', (done) => {
         const input = [
            new elementStart.PToken({
               attributes: [{
                  value: [
                     new text.PToken({ text: SToken.fromString('foo') }),
                  ]
               }],
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[0] as any).attributes[0].value).toEqual([ new text.PToken({ text: SToken.fromString('foo') }) ]);
            done();
         });
      });

      it('replaces general entity references with their values', (done) => {
         const refToPe = new ParameterEntityReferencePToken({
            open: SToken.fromString('&'),
            name: SToken.fromString('pe'),
         });
         const refToGe = new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
            name: SToken.fromString('ge'),
         });

         const input = [
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe'),
               value: [
                  new text.PToken({ text: SToken.fromString('pe') }),
               ],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('ge'),
               value: [
                  new text.PToken({ text: SToken.fromString('ge') }),
                  refToPe
               ],
            }),
            new elementStart.PToken({
               attributes: [{
                  value: [
                     new text.PToken({ text: SToken.fromString('foo') }),
                     refToGe,
                  ]
               }],
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[2] as any).attributes[0].value).toEqual([
               new text.PToken({ text: SToken.fromString('foo') }),
               new GeneralEntityStartPToken(refToGe),
               new text.PToken({ text: SToken.fromString('ge') }),
               new ParameterEntityStartPToken(refToPe),
               new text.PToken({ text: SToken.fromString('pe') }),
               new ParameterEntityEndPToken(refToPe),
               new GeneralEntityEndPToken(refToGe),
            ]);
            done();
         });
      });

      it('does not replace a reference if it has no name', (done) => {
         const refToGe = new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
         });

         const input = [
            new elementStart.PToken({
               attributes: [{
                  value: [
                     new text.PToken({ text: SToken.fromString('foo') }),
                     refToGe,
                  ]
               }],
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[0] as any).attributes[0].value).toEqual([
               new text.PToken({ text: SToken.fromString('foo') }),
               refToGe,
            ]);
            done();
         });
      });

   });

   describe('general entity reference', () => {

      it('does not replace the reference if there is no corresponding declaration', (done) => {
         const input = [
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('foo'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(1);
            expect(results[0].type).toEqual(GENERAL_ENTITY_REFERENCE_PTOKEN);
            done();
         });
      });

      it('does not replace the reference if that reference has no name', (done) => {
         const input = [
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
            })
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(1);
            expect(results[0].type).toEqual(GENERAL_ENTITY_REFERENCE_PTOKEN);
            done();
         });
      });

      it('does not replace the reference if that reference is an unparsed entity', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('foo'),
               nDataName: SToken.fromString('notation'),
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('foo'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(2);
            expect(results[1].type).toEqual(GENERAL_ENTITY_REFERENCE_PTOKEN);
            done();
         });
      });

      it('does not replace the reference if that reference is to an external entity and this is not validating', (done) => {
         externalMap.publicName = 'I will not be used';
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('foo'),
               externalId: {
                  public: {
                     value: [ new text.PToken({ text: SToken.fromString('publicName') }), ],
                  }
               },
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('foo'),
            }),
         ];

         doExpand(false, input, (results) => {
            expect(results.length).toEqual(2);
            expect(results[1].type).toEqual(GENERAL_ENTITY_REFERENCE_PTOKEN);
            done();
         });
      });

      it('replaces an entity reference to an internal entity', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('foo'),
               value: [ new TextPToken({ text: SToken.fromString('test') }) ],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('foo'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(4);
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual('CHARDATA');
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('replaces an entity reference to an internal entity, even if that has an empty TextPToken', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('foo'),
               value: [ new TextPToken() ],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('foo'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(3);
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('replaces an entity reference to an external entity if validating', (done) => {
         externalMap.publicName = 'some value';
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('foo'),
               externalId: {
                  public: {
                     value: [ new text.PToken({ text: SToken.fromString('publicName') }), ],
                  }
               },
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('foo'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(4);
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual('CHARDATA');
            expect((results[2] as any).text.str).toEqual('some value');
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

   });

   describe('parameter entity reference', () => {

      it('does not replace the reference if there is no corresponding declaration', (done) => {
         const input = [
            new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('foo'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(1);
            expect(results[0].type).toEqual(PARAMETER_ENTITY_REFERENCE_PTOKEN);
            done();
         });
      });

     it('does not replace the reference if it has no name', (done) => {
         const input = [
            new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(1);
            expect(results[0].type).toEqual(PARAMETER_ENTITY_REFERENCE_PTOKEN);
            done();
         });
      });

     it('does not replace the reference if that reference is to an external entity and this is not validating', (done) => {
         const input = [
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('foo'),
               externalId: {},
            }),
            new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('foo'),
            }),
         ];

         doExpand(false, input, (results) => {
            expect(results.length).toEqual(2);
            expect(results[1].type).toEqual(PARAMETER_ENTITY_REFERENCE_PTOKEN);
            done();
         });
      });

      it('replaces the reference if it is an internal entity', (done) => {
         const input = [
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('foo'),
               value: [],
            }),
            new ParameterEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('foo'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(3);
            expect(results[1].type).toEqual(PARAMETER_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(PARAMETER_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('replaces the reference if it is an external entity and this is validating', (done) => {
         externalMap.publicName = '<!ENTITY bar "foo">';
         const input = [
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('foo'),
               externalId: {
                  public: {
                     value: [ new text.PToken({ text: SToken.fromString('publicName') }), ],
                  }
               },
            }),
            new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('foo'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(4);

            expect(results[1].type).toEqual(PARAMETER_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(GENERAL_ENTITY_DECLARATION_PTOKEN);
            expect(results[3].type).toEqual(PARAMETER_ENTITY_END_PTOKEN);
            done();
         });
      });

   });

});
