/* Copyright ® 2018-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Token, EntityLocation, EntityMetaData, Range } from "basic";
import { XmlWarning, WellFormedError } from "error";
import { SToken, STokenSource } from "sToken";
import {
   GeneralEntityReferencePToken,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   GENERAL_ENTITY_START_PTOKEN,
   GENERAL_ENTITY_END_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,

   attListDeclaration,
   ElementStartPToken,
   unassigned,
   NotationDeclarationPToken,
   ParameterEntityStartPToken,
   ParameterEntityEndPToken,
   ParameterEntityReferencePToken,
   ParameterEntityDeclarationPToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityStartPToken,
   GeneralEntityEndPToken,
   XmlDeclarationPToken,

   CHARDATA_PTOKEN,
   INTERNAL_SUBSET_START_TOKEN,
   INTERNAL_SUBSET_END_TOKEN,
   EXTERNAL_SUBSET_START_TOKEN,
   EXTERNAL_SUBSET_END_TOKEN,
   NOTATION_DECLARATION_PTOKEN,
   InternalSubsetStartToken,
   InternalSubsetEndToken,
   ElementEndPToken,
   TextDeclarationPToken,
   TEXTDECL_PTOKEN,
   PToken,
} from "token";
import { ExpandedLiteralValuePToken } from "source/token/entityDeclaration"; // @@@ TEMP

import { EntityExpander, ExpandToken } from "../EntityExpander";

import { TextPToken, TEXT_PTOKEN } from "source/token/text";
import { PTokenStream, PTokenFromLiteralStream } from "pTokenStream";
import { ExternalId } from "source/token/common/externalId";
import { defaultExtractors } from "extractor";
import { AttListPToken } from "source/token/attListDeclaration";
import { UnassignedType, UnassignedArray } from "source/token/common/unassigned";
import { CharRefPToken, CHARREF_PTOKEN } from "source/token/charRef";
import { DocTypeStartPToken } from "source/token/docTypeStart";
import { DocTypeEndPToken } from "source/token/docTypeEnd";
import { ELEMENT_DECLARATION_PTOKEN, ElementDeclarationPToken } from "source/token/elementDeclaration";
// import { isNullOrUndefined } from "util";
import { CharDataPToken } from "source/token/charData";
import { expectError } from "./utils";

const toSToken = SToken.fromString;

describe('EntityExpander (unit)', () => {
   const externalMap: { [publicName: string]: string } = {};

   function processBody(sTokenSource: STokenSource, inContent: boolean, writeToken: ExpandToken, done: () => void) {
      const pTokenStream = new PTokenStream(sTokenSource);

      (pTokenStream as any)._inContent = inContent;

      pTokenStream.on('data', (token: PToken) => {
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

      const str = externalMap[(externalId.system!.value[0] as any).text.str];
      sTokenSource.addText(str);
      sTokenSource.endText();

      return sTokenSource;
   }

   function doExpand(validate: boolean, tokens: Array<Token>, allDone: (results: Array<Token>) => void) {
      const results: Array<Token> = [];
      const unsent = tokens.slice(0);
      const entityExpander = new EntityExpander(validate, pushToken, {
         processBody,
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

   describe('DOCTYPE declaration', () => {

      it('adds no internal or external entity markers if there are none', (done) => {
         const input = [
            new DocTypeStartPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('root'),
            }),
            new DocTypeEndPToken({
               docTypeStartPToken: new DocTypeStartPToken({ open: SToken.fromString('<!') }),
               close: SToken.fromString('>'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(2);
            done();
         });
      });

      it('adds an internal subset markers if there is an internal subset (even if empty)', (done) => {
         const input = [
            new DocTypeStartPToken({
               name: SToken.fromString('root'),
               open: SToken.fromString('<!'),
               openSubset: SToken.fromString('['),
            }),
            new NotationDeclarationPToken({ open: SToken.fromString('<!') }),
            new DocTypeEndPToken({
               docTypeStartPToken: new DocTypeStartPToken({ open: SToken.fromString('<!') }),
               closeSubset: SToken.fromString(']'),
               close: SToken.fromString('>'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(5);
            expect(results[1].type).toEqual(INTERNAL_SUBSET_START_TOKEN);
            expect(results[3].type).toEqual(INTERNAL_SUBSET_END_TOKEN);
            done();
         });
      });

      it('adds an external subset markers if there is an externalId', (done) => {
         externalMap.systemFoo = '<!ELEMENT one ANY>';
         const input = [
            new DocTypeStartPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('root'),
               externalId: {
                  system: {
                     value: [
                        new TextPToken({ text: SToken.fromString('systemFoo') }),
                     ],
                  }
               },
            }),
            new DocTypeEndPToken({
               docTypeStartPToken: new DocTypeStartPToken({ open: SToken.fromString('<!') }),
               close: SToken.fromString('>'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(5);
            expect(results[1].type).toEqual(EXTERNAL_SUBSET_START_TOKEN);
            expect(results[2].type).toEqual(ELEMENT_DECLARATION_PTOKEN);
            expect(results[3].type).toEqual(EXTERNAL_SUBSET_END_TOKEN);
            done();
         });
      });

      it('adds an internal and external subset markers if both are there', (done) => {
         externalMap.systemFoo = '<!ELEMENT one ANY>';
         const input = [
            new DocTypeStartPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('root'),
               openSubset: SToken.fromString('['),
               externalId: {
                  system: {
                     value: [
                        new TextPToken({ text: SToken.fromString('systemFoo') }),
                     ],
                  }
               },
            }),
            new NotationDeclarationPToken({ open: SToken.fromString('<!') }),
            new DocTypeEndPToken({
               docTypeStartPToken: new DocTypeStartPToken({ open: SToken.fromString('<!') }),
               closeSubset: SToken.fromString(']'),
               close: SToken.fromString('>'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(8);
            expect(results[1].type).toEqual(INTERNAL_SUBSET_START_TOKEN);
            expect(results[2].type).toEqual(NOTATION_DECLARATION_PTOKEN);
            expect(results[3].type).toEqual(INTERNAL_SUBSET_END_TOKEN);
            expect(results[4].type).toEqual(EXTERNAL_SUBSET_START_TOKEN);
            expect(results[5].type).toEqual(ELEMENT_DECLARATION_PTOKEN);
            expect(results[6].type).toEqual(EXTERNAL_SUBSET_END_TOKEN);
            done();
         });
      });

   });

   describe('ATTLIST declaration', () => {

      it('does not change the value if it contains no general entity references', (done) => {
         const input = [
            new AttListPToken({
               open: toSToken('<!'),
               attDefs: [{
                  value: [
                     new TextPToken({ text: SToken.fromString('foo') }),
                  ]
               }] as any,
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[0] as any).attDefs[0].value).toEqual([new TextPToken({ text: SToken.fromString('foo') })]);
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
                  new TextPToken({ text: SToken.fromString('pe') }),
               ],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('ge'),
               value: [
                  new TextPToken({ text: SToken.fromString('ge') }),
                  refToPe
               ],
            }),
            new AttListPToken({
               open: toSToken('<!'),
               attDefs: [{
                  value: [
                     new TextPToken({ text: SToken.fromString('foo') }),
                     refToGe,
                  ]
               }] as any,
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[2] as any).attDefs[0].value).toEqual([
               new TextPToken({ text: SToken.fromString('foo') }),
               new GeneralEntityStartPToken(refToGe),
               new CharDataPToken({ text: new SToken('gepe', 'gepe', new Range(new EntityLocation(), 0, 0, 0, 4, 0, 4)) }),
               // new TextPToken({ text: SToken.fromString('ge') }),
               // new ParameterEntityStartPToken(refToPe),
               // new TextPToken({ text: SToken.fromString('pe') }),
               // new ParameterEntityEndPToken(refToPe),
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
               open: toSToken('<!'),
               attDefs: [{
                  value: [
                     new TextPToken({ text: SToken.fromString('foo') }),
                     refToGe,
                  ]
               }] as any,
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[0] as any).attDefs[0].value).toEqual([
               new TextPToken({ text: SToken.fromString('foo') }),
               refToGe,
            ]);
            done();
         });
      });

      it('expands a parameter entity reference before assigning unassigned values', (done) => {
         const peRef = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            name: SToken.fromString('pe1'),
         });
         let didAssign = false;
         const unassignedVals = [{
            type: UnassignedType.REFERENCE,
            token: peRef,
         }];
         const input = [
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe1'),
               value: [
                  new TextPToken({ text: SToken.fromString('attr1 CDATA') }),
                  new TextPToken({ text: SToken.fromString(' #REQUIRED') }),
               ],
            }),
            new AttListPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('elementName'),
               unassigned: unassignedVals,
            }),
         ];

         spyOn(attListDeclaration, 'assignUnassigned').and.callFake((pToken: AttListPToken) => {
            didAssign = true;
            expect(pToken.unassigned).toEqualRangeless([{
                  type: UnassignedType.ENTITY_START,
                  token: peRef,
               },
               unassigned.wordFromSToken(SToken.fromString('attr1')),
               unassigned.spaceFromSToken(SToken.fromString(' ')),
               unassigned.wordFromSToken(SToken.fromString('CDATA')),
               unassigned.spaceFromSToken(SToken.fromString(' ')),
               unassigned.wordFromSToken(SToken.fromString('#REQUIRED')),
               {
                  type: UnassignedType.ENTITY_END,
                  token: peRef,
               },
            ]);
         });

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(2);
            expect(didAssign).toEqual(true);
            done();
         });
      });

   });

   describe('ELEMENT declaration', () => {

   });

   describe('ENTITY declaration', () => {

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
                  new TextPToken({ text: SToken.fromString('foo') }),
               ],
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[0] as any).value).toEqual([new TextPToken({ text: SToken.fromString('foo') })]);
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
                  new TextPToken({ text: SToken.fromString('pe1') }),
               ],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe2'),
               value: [
                  new TextPToken({ text: SToken.fromString('pe2') }),
                  refToPe1
               ],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               value: [
                  refToPe1,
                  new TextPToken({ text: SToken.fromString('foo') }),
                  refToPe2,
               ],
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[2] as any).value).toEqual([
               new ParameterEntityStartPToken(refToPe1),
               new TextPToken({ text: SToken.fromString('pe1') }),
               new ParameterEntityEndPToken(refToPe1),
               new TextPToken({ text: SToken.fromString('foo') }),
               new ParameterEntityStartPToken(refToPe2),
               new TextPToken({ text: SToken.fromString('pe2') }),
               new ParameterEntityStartPToken(refToPe1),
               new TextPToken({ text: SToken.fromString('pe1') }),
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
         externalMap.systemUrl = 'external value %pe1;';

         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe1'),
               value: [
                  new TextPToken({ text: SToken.fromString('pe1') }),
               ],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe2'),
               externalId: {
                  system: {
                     value: [new TextPToken({ text: SToken.fromString('systemUrl') }),],
                  }
               },
               value: [],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               value: [
                  refToPe1,
                  new TextPToken({ text: SToken.fromString('foo') }),
                  refToPe2,
               ],
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[2] as any).value).toEqualRangeless([
               new ParameterEntityStartPToken(refToPe1),
               new TextPToken({ text: SToken.fromString('pe1') }),
               new ParameterEntityEndPToken(refToPe1),
               new TextPToken({ text: SToken.fromString('foo') }),
               new ParameterEntityStartPToken(refToPe2),
               new TextPToken({ text: SToken.fromString('external value ') }),
               new ParameterEntityStartPToken(secondRefToPe1),
               new TextPToken({ text: SToken.fromString('pe1') }),
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
                  new TextPToken({ text: SToken.fromString('pe1') }),
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

      it('expands a parameter entity reference before assigning unassigned values', (done) => {
         const peRef = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            name: SToken.fromString('pe1'),
         });
         let didAssign = false;
         const unassignedVals = [{
            type: UnassignedType.REFERENCE,
            token: peRef,
         }];
         const entityDecl = new GeneralEntityDeclarationPToken({
            open: SToken.fromString('<!'),
            unassigned: unassignedVals,
         });
         const input = [
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('foo'),
               value: [
                  new TextPToken({ text: SToken.fromString('and') }),
               ],
            }),
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe1'),
               value: [
                  new TextPToken({ text: SToken.fromString('entity') }),
                  new TextPToken({ text: SToken.fromString('name "super ') }),
                  new ParameterEntityReferencePToken({
                     open: SToken.fromString('%'),
                     name: SToken.fromString('foo'),
                  }),
                  new TextPToken({ text: SToken.fromString(' duper"') }),
               ],
            }),
            entityDecl,
         ];

         spyOn(entityDecl, 'assignUnassigned').and.callFake(() => {
            didAssign = true;
            expect(entityDecl.unassigned).toEqualRangeless([{
                  type: UnassignedType.ENTITY_START,
                  token: peRef,
               },
               unassigned.wordFromSToken(SToken.fromString('entityname')),
               unassigned.spaceFromSToken(SToken.fromString(' ')),
               {
                  type: UnassignedType.LITERAL,
                  token: {
                     openQuote: SToken.fromString('"'),
                     value: [
                        new TextPToken({
                           text: SToken.fromString('super and duper'),
                        }),
                     ],
                     closeQuote: SToken.fromString('"'),
                  },
               },{
                  type: UnassignedType.ENTITY_END,
                  token: peRef,
               },
            ]);
         });

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(3);
            expect(didAssign).toEqual(true);
            done();
         });
      });

   });

   describe('NOTATION declaration', () => {

      it('passes a declaration with no unassigned values through without changes', (done) => {
         const input = [
            new NotationDeclarationPToken({
               type: 'NOTATION_DECLARATION_PTOKEN',
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               externalId: {
                  type: 'EXTERNAL_ID',
               },
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(1);
            expect(results[0]).toEqual(new NotationDeclarationPToken({
               type: 'NOTATION_DECLARATION_PTOKEN',
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               extra: [],
               externalId: {
                  type: 'EXTERNAL_ID',
               },
            }));
            done();
         });
      });

      it('passes a declaration with an unassigned value through', (done) => {
         const unassignedVals = [unassigned.wordFromSToken(SToken.fromString('public'))];
         const notationDecl = new NotationDeclarationPToken({
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: SToken.fromString('<!'),
            name: SToken.fromString('test'),
            unassigned: unassignedVals,
            externalId: {
               type: 'EXTERNAL_ID',
               nextPropName: 'idType',
               unassigned: unassignedVals,
            },
         });
         const input = [
            notationDecl,
         ];

         spyOn(notationDecl, 'assignUnassigned').and.callFake(() => {
            expect(notationDecl.unassigned).toEqual([
               unassigned.wordFromSToken(SToken.fromString('public')),
            ]);
         });

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(1);
            done();
         });
      });

      it('does not expand an unassigned value that is a reference with no declaration', (done) => {
         const unassignedVals: any = [{
            type: UnassignedType.REFERENCE,
            token: new ParameterEntityReferencePToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('frog'),
            })
         }];
         const notationDecl = new NotationDeclarationPToken({
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: SToken.fromString('<!'),
            name: SToken.fromString('test'),
            unassigned: unassignedVals,
         });
         const input = [
            notationDecl,
         ];

         spyOn(notationDecl, 'assignUnassigned');

         doExpand(true, input, (results: any[]) => {
            expect(results[0].unassigned.length).toEqual(1);
            expect(results[0].unassigned[0].type).toEqual('reference');
            done();
         });
      });

      it('copes with a charref being incompletely defined', (done) => {
         const unassignedVals: any = [{
            type: UnassignedType.REFERENCE,
            token: new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('badCharRef'),
            })
         }];
         const paramDecl = new ParameterEntityDeclarationPToken({
            open: SToken.fromString('<!'),
            parameter: SToken.fromString('%'),
            name: SToken.fromString('badCharRef'),
            value: [
               new CharRefPToken({ open: SToken.fromString('&#') }),
               new TextPToken({ text: SToken.fromString('UBLIC') }),
            ],
         });
         const notationDecl = new NotationDeclarationPToken({
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: SToken.fromString('<!'),
            name: SToken.fromString('test'),
            unassigned: unassignedVals,
         });
         const input = [
            paramDecl,
            notationDecl,
         ];

         spyOn(notationDecl, 'assignUnassigned');

         doExpand(true, input, (results: any[]) => {
            expect(results[1].unassigned[1].type).toEqual('word');
            done();
         });
      });

      it('replaces multiple unassigned references to the same entity', (done) => {
         externalMap.publicName = 'I will not be used';
         const unassignedVals: any = [{
            type: UnassignedType.REFERENCE,
            token: new ParameterEntityReferencePToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('externalEntity'),
            })
         }, {
            type: UnassignedType.REFERENCE,
            token: new ParameterEntityReferencePToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('externalEntity'),
            })
         }];
         const paramDecl = new ParameterEntityDeclarationPToken({
            open: SToken.fromString('<!'),
            parameter: SToken.fromString('%'),
            name: SToken.fromString('externalEntity'),
            externalId: {
               system: {
                  value: [new TextPToken({ text: SToken.fromString('publicName') }),],
               }
            },
         });
         const notationDecl = new NotationDeclarationPToken({
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: SToken.fromString('<!'),
            name: SToken.fromString('test'),
            unassigned: unassignedVals,
         });
         const input = [
            paramDecl,
            notationDecl,
         ];

         spyOn(notationDecl, 'assignUnassigned');

         doExpand(true, input, (results: any[]) => {
            expect(results[1].unassigned.length).toEqual(22); // not quite right.
            done();
         });
      });

      it('replaces multiple unassigned references to the different entities', (done) => {
         const unassignedVals: any = [{
            type: UnassignedType.REFERENCE,
            token: new ParameterEntityReferencePToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('internalEntity'),
            })
         }, {
            type: UnassignedType.REFERENCE,
            token: new ParameterEntityReferencePToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('internalEntity2'),
            })
         }];
         const paramDecl = new ParameterEntityDeclarationPToken({
            open: SToken.fromString('<!'),
            parameter: SToken.fromString('%'),
            name: SToken.fromString('internalEntity'),
            value: [new TextPToken({ text: SToken.fromString('publicName') }),],
         });
         const paramDecl2 = new ParameterEntityDeclarationPToken({
            open: SToken.fromString('<!'),
            parameter: SToken.fromString('%'),
            name: SToken.fromString('internalEntity2'),
            value: [new TextPToken({ text: SToken.fromString('publicName') })],
         });
         const notationDecl = new NotationDeclarationPToken({
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: SToken.fromString('<!'),
            name: SToken.fromString('test'),
            unassigned: unassignedVals,
         });
         const input = [
            paramDecl,
            paramDecl2,
            notationDecl,
         ];

         spyOn(notationDecl, 'assignUnassigned');

         doExpand(true, input, (results: any[]) => {
            expect(results[2].unassigned.length).toEqual(6); // not quite right.
            done();
         });
      });

      it('will try to retrieve from an external reference', (done) => {
         externalMap.publicName = 'I will not be used';
         const unassignedVals: any = [{
            type: UnassignedType.REFERENCE,
            token: new ParameterEntityReferencePToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('externalEntity'),
            })
         }];
         const paramDecl = new ParameterEntityDeclarationPToken({
            open: SToken.fromString('<!'),
            parameter: SToken.fromString('%'),
            name: SToken.fromString('externalEntity'),
            externalId: {
               system: {
                  value: [new TextPToken({ text: SToken.fromString('publicName') }),],
               }
            },
         });
         const notationDecl = new NotationDeclarationPToken({
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: SToken.fromString('<!'),
            name: SToken.fromString('test'),
            unassigned: unassignedVals,
         });
         const input = [
            paramDecl,
            notationDecl,
         ];

         spyOn(notationDecl, 'assignUnassigned');

         doExpand(true, input, (results: any[]) => {
            expect(results[1].unassigned.length).toEqual(11);   // the parsing is wrong.
            done();
         });
      });

      it('expands a parameter entity reference before assigning unassigned values', (done) => {
         const refToPe1 = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            name: SToken.fromString('pe1'),
         });
         const unassignedVals: any = [{
            type: UnassignedType.REFERENCE,
            token: refToPe1,
         }];
         const notationDecl = new NotationDeclarationPToken({
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: SToken.fromString('<!'),
            name: SToken.fromString('test'),
            unassigned: unassignedVals,
            externalId: {
               type: 'EXTERNAL_ID',
               nextPropName: 'idType',
               unassigned: unassignedVals,
            },
         });

         const input = [
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe1'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('80') }),
                  new TextPToken({ text: SToken.fromString('UBLIC') }),
               ],
            }),
            notationDecl,
         ];

         spyOn(notationDecl, 'assignUnassigned').and.callFake(() => {
            expect(notationDecl.unassigned).toEqualRangeless([{
                  type: UnassignedType.ENTITY_START,
                  token: refToPe1,
               }, 
               unassigned.wordFromSToken(SToken.fromString('PUBLIC')), {
                  type: UnassignedType.ENTITY_END,
                  token: refToPe1,
               },
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
         const unassignedVals: UnassignedArray = [{
            type: UnassignedType.REFERENCE,
            token: refToPe1,
         }];
         const notationDecl = new NotationDeclarationPToken({
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: SToken.fromString('<!'),
            name: SToken.fromString('test'),
            unassigned: unassignedVals,
            externalId: {
               type: 'EXTERNAL_ID',
               nextPropName: 'idType',
               unassigned: unassignedVals,
            },
         });
         const input = [
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe2'),
               value: [
                  new TextPToken({ text: SToken.fromString('C') }),
               ],
            }),
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe1'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('80') }),
                  new TextPToken({ text: SToken.fromString('UBLI') }),
                  new ParameterEntityReferencePToken({
                     open: SToken.fromString('%'),
                     name: SToken.fromString('pe2'),
                  }),
               ],
            }),
            notationDecl,
         ];

         spyOn(notationDecl, 'assignUnassigned').and.callFake(() => {
            expect(notationDecl.unassigned).toEqualRangeless([{
                  type: UnassignedType.ENTITY_START,
                  token: refToPe1,
               },
               unassigned.wordFromSToken(SToken.fromString('PUBLIC')), {
                  type: UnassignedType.ENTITY_END,
                  token: refToPe1,
               },
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
            new ElementStartPToken({
               open: SToken.fromString('<'),
               attributes: [{
                  value: [
                     new TextPToken({ text: SToken.fromString('foo') }),
                  ]
               }],
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[0] as any).attributes[0].value).toEqual([new TextPToken({ text: SToken.fromString('foo') })]);
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
                  new TextPToken({ text: SToken.fromString('pe') }),
               ],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('ge'),
               value: [
                  new TextPToken({ text: SToken.fromString('ge') }),
                  refToPe
               ],
            }),
            new ElementStartPToken({
               open: SToken.fromString('<'),
               attributes: [{
                  value: [
                     new TextPToken({ text: SToken.fromString('foo') }),
                     refToGe,
                  ]
               }],
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[2] as any).attributes[0].value).toEqual([
               new TextPToken({ text: SToken.fromString('foo') }),
               new GeneralEntityStartPToken(refToGe),
               new CharDataPToken({ text: new SToken('gepe', 'gepe', new Range(new EntityLocation(), 0, 0, 0, 4, 0, 4)) }),
               // new TextPToken({ text: SToken.fromString('ge') }),
               // new ParameterEntityStartPToken(refToPe),
               // new TextPToken({ text: SToken.fromString('pe') }),
               // new ParameterEntityEndPToken(refToPe),
               new GeneralEntityEndPToken(refToGe),
            ]);
            done();
         });
      });

      xit('replaces predefined entity references with data', (done) => {
         const refToGe = new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
            name: SToken.fromString('lt'),
         });

         const input = [
            new ElementStartPToken({
               open: SToken.fromString('<'),
               attributes: [{
                  value: [
                     refToGe,
                  ]
               }],
            }),
         ];

         doExpand(true, input, (results) => {
            const attrValue = (results[0] as any).attributes[0].value;
            // console.log(JSON.stringify(attrValue, undefined, 5));
            expect(attrValue.length).toEqual(3);
            expect(attrValue[0].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(attrValue[1]).toEqualRangeless(new CharRefPToken({
               open: SToken.fromString('&#'),
               digits: SToken.fromString('38'),
               close: SToken.fromString(';'),
               openSpace: undefined,
               hexMarkerSpace: undefined,
               digitsSpace: undefined,
            }));
            expect(attrValue[2].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('does not replace a reference if it has no name', (done) => {
         const refToGe = new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
         });

         const input = [
            new ElementStartPToken({
               open: SToken.fromString('<'),
               attributes: [{
                  value: [
                     new TextPToken({ text: SToken.fromString('foo') }),
                     refToGe,
                  ]
               }],
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[0] as any).attributes[0].value).toEqual([
               new TextPToken({ text: SToken.fromString('foo') }),
               refToGe,
            ]);
            done();
         });
      });

      xit('replaces general entity references that reference others that have char refs that form markup', (done) => {
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
                  new TextPToken({ text: SToken.fromString('pe') }),
               ],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('ge'),
               value: [
                  new CharRefPToken({
                     open: SToken.fromString('&#'),
                     digits: SToken.fromString('38'),
                  }),
                  new TextPToken({ text: SToken.fromString('pe;') }),
               ],
            }),
            new ElementStartPToken({
               open: SToken.fromString('<'),
               attributes: [{
                  value: [
                     new TextPToken({ text: SToken.fromString('foo') }),
                     refToGe,
                  ]
               }, {
                  value: [
                     new TextPToken({ text: SToken.fromString('foo') }),
                  ]
               }],
            }),
         ];

         doExpand(true, input, (results) => {
            expect((results[2] as any).attributes[0].value).toEqual([
               new TextPToken({ text: SToken.fromString('foo') }),
               new GeneralEntityStartPToken(refToGe),
               new ParameterEntityStartPToken(refToPe),
               new TextPToken({ text: SToken.fromString('pe') }),
               new ParameterEntityEndPToken(refToPe),
               new GeneralEntityEndPToken(refToGe),
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
                  system: {
                     value: [new TextPToken({ text: SToken.fromString('publicName') }),],
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

      it('expands an &lt; entity reference even if not declared (§4.6)', (done) => {
         const input = [
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('lt'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(4);
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2]).toEqualRangeless(new CharRefPToken({
               open: SToken.fromString('&#'),
               digits: SToken.fromString('60'),
               close: SToken.fromString(';'),
               openSpace: undefined,
               hexMarkerSpace: undefined,
               digitsSpace: undefined,
               charCode: 60,
            }));
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('reports a warning if "lt" is not declared (§4.6)', (done) => {
         const input = [
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('lt'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[0]).toEqual(new XmlWarning(XmlWarning.ID.PREDEFINED_UNDECLARED, ['lt'], input[0].open, input[0].open));
            done();
         });
      });

      it('expands an &amp; entity reference even if not declared (§4.6)', (done) => {
         const input = [
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('amp'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(4);
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2]).toEqualRangeless(new CharRefPToken({
               open: SToken.fromString('&#'),
               digits: SToken.fromString('38'),
               close: SToken.fromString(';'),
               openSpace: undefined,
               hexMarkerSpace: undefined,
               digitsSpace: undefined,
               charCode: 38,
            }));
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('expands an &gt; entity reference even if not declared (§4.6)', (done) => {
         const input = [
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('gt'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(4);
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2]).toEqualRangeless(new CharDataPToken({
               text: SToken.fromString('>'),
            }));
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('expands an &apos; entity reference even if not declared (§4.6)', (done) => {
         const input = [
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('apos'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(4);
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2]).toEqualRangeless(new CharDataPToken({
               text: SToken.fromString('\''),
            }));
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('expands an &apos; entity reference even if not declared (§4.6)', (done) => {
         const input = [
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('quot'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(4);
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2]).toEqualRangeless(new CharDataPToken({
               text: SToken.fromString('"'),
            }));
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('reports an error if "lt" is externally declared (§4.6)', (done) => {
         externalMap.systemFoo = '&#38;#60;';
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('lt'),
               externalId: {
                  system: {
                     value: [
                        new TextPToken({ text: SToken.fromString('systemFoo') }),
                     ],
                  }
               },
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('lt'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[1]).toEqual(new WellFormedError(WellFormedError.ID.PREDEFINED_EXTERNAL, ['lt'], input[0].open, input[0].open));
            done();
         });
      });

      it('allows "lt" to be declared as a &#38;#60; (§4.6)', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('lt'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('38'), charCode: 38 }),
                  new TextPToken({ text: SToken.fromString('#60;') }),
               ],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('lt'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(CHARREF_PTOKEN);
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('reports an error if "lt" has extra stuff after the initial declaration (§4.6)', (done) => {
         externalMap.systemFoo = '&#38;#60;';
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('lt'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('38'), charCode: 38 }),
                  new TextPToken({ text: SToken.fromString('#60;frisbee') }),
               ],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('lt'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[3]).toEqual(new WellFormedError(WellFormedError.ID.PREDEFINED_INVALD, ['lt'], input[0].open, input[0].open));
            done();
         });
      });

      it('allows "lt" to be declared as a &#x26;#x3c; (§4.6)', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('lt'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), hexMarker: SToken.fromString('x'), digits: SToken.fromString('26'), charCode: 38 }),
                  new TextPToken({ text: SToken.fromString('#x3c;') }),
               ],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('lt'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(CHARREF_PTOKEN);
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('allows "lt" to be declared as a &#x26;&#35;&#120;&#51;&#99;&#59; (§4.6)', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('lt'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), hexMarker: SToken.fromString('x'), digits: SToken.fromString('26'), charCode: 38 }),
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('35'), charCode: 35 }),
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('120'), charCode: 120 }),
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('51'), charCode: 51 }),
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('99'), charCode: 99 }),
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('59'), charCode: 59 }),
               ],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('lt'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(CHARREF_PTOKEN);
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('does not allow "lt" to be declared as a &#60; (§4.6)', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('lt'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('60'), charCode: 60 }),
               ],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('lt'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[2]).toEqual(new WellFormedError(WellFormedError.ID.PREDEFINED_INVALD, ['lt'], input[0].open, input[0].open));
            done();
         });
      });

      it('allows "amp" to be declared as a &#x26;#x3c; (§4.6)', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('amp'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('38'), charCode: 38 }),
                  new TextPToken({ text: SToken.fromString('#38;') }),
               ],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('amp'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(CHARREF_PTOKEN);
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('does not allow "amp" to be declared as a &#38; (§4.6)', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('amp'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('38'), charCode: 38 }),
               ],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('amp'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[2]).toEqual(new WellFormedError(WellFormedError.ID.PREDEFINED_INVALD, ['amp'], input[0].open, input[0].open));
            done();
         });
      });

      it('allows "gt" to be declared as a &#38;#62; (§4.6)', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('gt'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('38'), charCode: 38 }),
                  new TextPToken({ text: SToken.fromString('#62;') }),
               ],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('gt'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(CHARREF_PTOKEN);
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('allows "gt" to be declared as a &#62; (§4.6)', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('gt'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('62'), charCode: 62 }),
               ],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('gt'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(CHARDATA_PTOKEN);
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('allows "apos" to be declared as a &#38;#39; (§4.6)', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('apos'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('38'), charCode: 38 }),
                  new TextPToken({ text: SToken.fromString('#39;') }),
               ],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('apos'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(CHARREF_PTOKEN);
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('allows "apos" to be declared as a &#39; (§4.6)', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('apos'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('39'), charCode: 39 }),
               ],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('apos'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(CHARDATA_PTOKEN);
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('allows "quot" to be declared as a &#38;#34; (§4.6)', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('quot'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('38'), charCode: 38 }),
                  new TextPToken({ text: SToken.fromString('#34;') }),
               ],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('quot'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(CHARREF_PTOKEN);
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('allows "quot" to be declared as a &#34; (§4.6)', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('quot'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), digits: SToken.fromString('34'), charCode: 34 }),
               ],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('quot'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(CHARDATA_PTOKEN);
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('skips a partially undefined charRef', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('foo'),
               value: [
                  new CharRefPToken({ open: SToken.fromString('&#'), charCode: 0 }),
               ],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('foo'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('replaces an entity reference to an internal entity', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('foo'),
               value: [new TextPToken({ text: SToken.fromString('test') })],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('foo'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(4);
            expect(results[1].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(CHARDATA_PTOKEN);
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('replaces an entity reference to an internal entity, even if that has an empty TextPToken', (done) => {
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('foo'),
               value: [new TextPToken({ text: SToken.fromString('') })],
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
         externalMap.systemUrl = 'some value';
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('foo'),
               externalId: {
                  system: {
                     value: [new TextPToken({ text: SToken.fromString('systemUrl') }),],
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
            expect(results[2].type).toEqual(CHARDATA_PTOKEN);
            expect((results[2] as any).text.str).toEqual('some value');
            expect(results[3].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
            done();
         });
      });

      it('reports an error if an entity is recursively referenced (§4.1)', (done) => {
         externalMap.systemUrl = 'some value';
         const input = [
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('one'),
               value: [new TextPToken({ text: SToken.fromString('&two; ') })],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('two'),
               value: [new TextPToken({ text: SToken.fromString('&one; ') })],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('one'),
            }),
         ];


         doExpand(true, input, (results) => {
            expect((results[4] as any).id).toEqual(WellFormedError.ID.REFERENCE_INVALID_RECURSION);
            done();
         });
      });

      it('inserts the TextDecl into the output stream, if it is present in an external entity (§4.3.2)', (done) => {
         externalMap.systemOuter = '<?xml version="1.1" encoding="usascii"?>Testing';
         const input = [
            new DocTypeStartPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('root'),
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('outer'),
               externalId: {
                  system: {
                     value: [
                        new TextPToken({ text: SToken.fromString('systemOuter') }),
                     ],
                  }
               },
            }),
            new DocTypeEndPToken({
               docTypeStartPToken: new DocTypeStartPToken({ open: SToken.fromString('<!') }),
               close: SToken.fromString('>'),
            }),
            new ElementStartPToken({
               open: SToken.fromString('root'),
               attributes: [],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('outer'),
            }),
            new ElementEndPToken({
               open: SToken.fromString('root'),
               attributes: [],
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[5].type).toEqual(TEXTDECL_PTOKEN);
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
         externalMap.systemUrl = '<!ENTITY bar "foo">';
         const input = [
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('foo'),
               externalId: {
                  system: {
                     value: [new TextPToken({ text: SToken.fromString('systemUrl') }),],
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

      it('replaces multiple references to the same entity', (done) => {
         externalMap.systemUrl = '(foo)';
         const input = [
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('foo'),
               externalId: {
                  system: {
                     value: [new TextPToken({ text: SToken.fromString('systemUrl') }),],
                  }
               },
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               value: [new ParameterEntityReferencePToken({
                  open: SToken.fromString('%'),
                  name: SToken.fromString('foo'),
               }), new ParameterEntityReferencePToken({
                  open: SToken.fromString('%'),
                  name: SToken.fromString('foo'),
               })],
            })
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(2);

            expect((results[1] as any).value.map((x: any) => x.type)).toEqual([
               'PARAMETER_ENTITY_START_PTOKEN', 'TEXT_PTOKEN', 'PARAMETER_ENTITY_END_PTOKEN',
               'PARAMETER_ENTITY_START_PTOKEN', 'TEXT_PTOKEN', 'PARAMETER_ENTITY_END_PTOKEN']);
            done();
         });
      });

      it('replaces multiple references to the distinct entity', (done) => {
         externalMap.systemUrl = '(foo)';
         externalMap.systemUrl2 = '(foo)';
         const input = [
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('foo'),
               externalId: {
                  system: {
                     value: [new TextPToken({ text: SToken.fromString('systemUrl') }),],
                  }
               },
            }),
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('bar'),
               externalId: {
                  system: {
                     value: [new TextPToken({ text: SToken.fromString('systemUrl2') }),],
                  }
               },
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               value: [new ParameterEntityReferencePToken({
                  open: SToken.fromString('%'),
                  name: SToken.fromString('foo'),
               }), new ParameterEntityReferencePToken({
                  open: SToken.fromString('%'),
                  name: SToken.fromString('bar'),
               })],
            })
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(3);

            expect((results[2] as any).value.map((x: any) => x.type)).toEqual([
               'PARAMETER_ENTITY_START_PTOKEN', 'TEXT_PTOKEN', 'PARAMETER_ENTITY_END_PTOKEN',
               'PARAMETER_ENTITY_START_PTOKEN', 'TEXT_PTOKEN', 'PARAMETER_ENTITY_END_PTOKEN']);
            done();
         });
      });

      it('inserts the TextDecl into the output stream, if it is present in an external entity (§4.3.2)', (done) => {
         externalMap.systemOuter = '<?xml version="1.1" encoding="usascii"?><!ENTITY nope "x">';
         const input = [
            new DocTypeStartPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('root'),
            }),
            new ParameterEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('outer'),
               externalId: {
                  system: {
                     value: [
                        new TextPToken({ text: SToken.fromString('systemOuter') }),
                     ],
                  }
               },
            }),
            new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('outer'),
            }),
            new DocTypeEndPToken({
               docTypeStartPToken: new DocTypeStartPToken({ open: SToken.fromString('<!') }),
               close: SToken.fromString('>'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results[3].type).toEqual(TEXTDECL_PTOKEN);
            done();
         });
      });

   });

   describe('standalone and non-validating processing', () => {

      it('does not expand a general entity reference when non-validating, standalone="no" and entity decl after pe ref', (done) => {
         const input = [
            new XmlDeclarationPToken({
               open: SToken.fromString('<?'),
               params: [{
                  name: SToken.fromString('standalone'),
                  value: SToken.fromString('no'),
               }],
            }),
            new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('foo'),
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               value: [
                  new TextPToken({ text: SToken.fromString('expanded!') }),
               ],
            }),
            new ElementStartPToken({
               open: SToken.fromString('ElementStart'),
               attributes: [],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('test'),
            }),
         ];

         doExpand(false, input, (results) => {
            expect(results.length).toEqual(5);
            expect(results[4].type).toEqual(GENERAL_ENTITY_REFERENCE_PTOKEN);
            done();
         });
      });

      it('expands a general entity reference when non-validating, standalone="yes" and entity decl after pe ref', (done) => {
         const input = [
            new XmlDeclarationPToken({
               open: SToken.fromString('<?'),
               params: [{
                  name: SToken.fromString('standalone'),
                  value: SToken.fromString('yes'),
               }],
            }),
            new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('foo'),
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               value: [
                  new TextPToken({ text: SToken.fromString('expanded!') }),
               ],
            }),
            new ElementStartPToken({
               open: SToken.fromString('ElementStart'),
               attributes: [],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('test'),
            }),
         ];

         doExpand(false, input, (results) => {
            expect(results.length).toEqual(7);
            expect(results[4].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            done();
         });
      });

      it('expands a general entity reference when validating when entity decl after pe ref', (done) => {
         const input = [
            new XmlDeclarationPToken({
               open: SToken.fromString('<?'),
               params: [{
                  name: SToken.fromString('standalone'),
                  value: SToken.fromString('no'),
               }],
            }),
            new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('foo'),
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               value: [
                  new TextPToken({ text: SToken.fromString('expanded!') }),
               ],
            }),
            new ElementStartPToken({
               open: SToken.fromString('ElementStart'),
               attributes: [],
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('test'),
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(7);
            expect(results[4].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            done();
         });
      });

      it('processes ATTLIST when non-validating, standalone="no" and entity decl after pe ref', (done) => {
         const input = [
            new XmlDeclarationPToken({
               open: SToken.fromString('<?'),
               params: [{
                  name: SToken.fromString('standalone'),
                  value: SToken.fromString('no'),
               }],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               value: [
                  new TextPToken({ text: SToken.fromString('expanded!') }),
               ],
            }),
            new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('foo'),
            }),
            new AttListPToken({
               open: toSToken('<!'),
               attDefs: [{
                  value: [
                     new GeneralEntityReferencePToken({
                        open: SToken.fromString('&'),
                        name: SToken.fromString('test'),
                     }),
                  ],
               }] as any,
            }),
         ];

         doExpand(false, input, (results) => {
            expect(results.length).toEqual(4);
            expect((results[3] as any).attDefs[0].value[0].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            done();
         });
      });

      it('processes an ATTLIST when non-validating, standalone="yes" and entity decl after pe ref', (done) => {
         const input = [
            new XmlDeclarationPToken({
               open: SToken.fromString('<?'),
               params: [{
                  name: SToken.fromString('standalone'),
                  value: SToken.fromString('yes'),
               }],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               value: [
                  new TextPToken({ text: SToken.fromString('expanded!') }),
               ],
            }),
            new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('foo'),
            }),
            new AttListPToken({
               open: toSToken('<!'),
               attDefs: [{
                  value: [
                     new GeneralEntityReferencePToken({
                        open: SToken.fromString('&'),
                        name: SToken.fromString('test'),
                     }),
                  ],
               }] as any,
            }),
         ];

         doExpand(false, input, (results) => {
            expect(results.length).toEqual(4);
            expect((results[3] as any).attDefs[0].value[0].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            done();
         });
      });

      it('expands a general entity reference when validating when entity decl after pe ref', (done) => {
         const input = [
            new XmlDeclarationPToken({
               open: SToken.fromString('<?'),
               params: [{
                  name: SToken.fromString('standalone'),
                  value: SToken.fromString('no'),
               }],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               value: [
                  new TextPToken({ text: SToken.fromString('expanded!') }),
               ],
            }),
            new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               name: SToken.fromString('foo'),
            }),
            new AttListPToken({
               open: toSToken('<!'),
               attDefs: [{
                  value: [
                     new GeneralEntityReferencePToken({
                        open: SToken.fromString('&'),
                        name: SToken.fromString('test'),
                     }),
                  ],
               }] as any,
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(4);
            expect((results[3] as any).attDefs[0].value[0].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
            done();
         });
      });

   });

   describe('Bugs found when working through xmlconf', () => {

      it('ibm09v04 throws a stream.push after EOF', (done) => {
         const input = [
            new XmlDeclarationPToken({
               open: SToken.fromString('<?'),
               params: [{
                  name: SToken.fromString('version'),
                  value: SToken.fromString('1.0'),
               }],
               close: SToken.fromString('?>'),
            }),
            new DocTypeStartPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('student'),
            }),
            new ElementDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('student'),
               children: {
                  open: SToken.fromString('('),
                  names: [{
                     particle: {
                        name: '#PCDATA'
                     }
                  }],
               },
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('RealName'),
               value: [
                  new TextPToken({ text: SToken.fromString('SnowMan') }),
               ],
            }),
            new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('FullName'),
               value: [
                  new TextPToken({ text: SToken.fromString('&RealName;') }),
               ],
            }),
            new DocTypeEndPToken({
               docTypeStartPToken: new DocTypeStartPToken({ open: SToken.fromString('<!') }),
               close: SToken.fromString('>'),
            }),
            new ElementStartPToken({
               open: SToken.fromString('<'),
               name: SToken.fromString('student'),
            }),
            new CharDataPToken({
               text: SToken.fromString('My Name is '),
            }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('FullName'),
            }),
            new CharDataPToken({
               text: SToken.fromString('. '),
            }),
            new ElementEndPToken({
               open: SToken.fromString('</'),
               name: SToken.fromString('student'),
            }),
         ];

         doExpand(false, input, (results) => {
            // console.log(JSON.stringify(results, undefined, 3));
            done();
         });
      });

   });
});
