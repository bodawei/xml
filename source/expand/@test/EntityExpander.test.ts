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
   ENTITY_DECLARATION_PTOKEN,

   text,
   ParameterEntityStartPToken,
   ParameterEntityEndPToken,
} from "token";
import { EntityDeclarationPToken, ExpandedLiteralValuePToken } from "source/token/entityDeclaration"; // @@@ TEMP

import { EntityExpander, ExpandToken } from "../EntityExpander";

import { TextPToken, TEXT_PTOKEN } from "source/token/text";
import { PTokenStream, PTokenFromLiteralStream } from "pTokenStream";
import { ExternalId } from "source/token/common/externalId";
import { defaultExtractors } from "extractor";

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

   describe('entity declaration', () => {

      it('ignores the declaration if it has no name (whitebox)', (done) => {
         const input = [
            new EntityDeclarationPToken({
               open: SToken.fromString('<!'),
               value: [],
            }),
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(1);
            expect(results[0].type).toEqual(ENTITY_DECLARATION_PTOKEN);
            done();
         });
      });

      it('ignores a second declaration with the same name (whitebox)', (done) => {
         const input = [
            new EntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               value: [],
            }),
            new EntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
               value: [],
            })
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(2);
            expect(results[0].type).toEqual(ENTITY_DECLARATION_PTOKEN);
            expect(results[1].type).toEqual(ENTITY_DECLARATION_PTOKEN);
            done();
         });
      });

      it('does not change the value if it contains no parameter entity references', (done) => {
         const input = [
            new EntityDeclarationPToken({
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
            new EntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe1'),
               value: [
                  new text.PToken({ text: SToken.fromString('pe1') }),
               ],
            }),
            new EntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe2'),
               value: [
                  new text.PToken({ text: SToken.fromString('pe2') }),
                  refToPe1
               ],
            }),
            new EntityDeclarationPToken({
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
            new EntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe1'),
               value: [
                  new text.PToken({ text: SToken.fromString('pe1') }),
               ],
            }),
            new EntityDeclarationPToken({
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
            new EntityDeclarationPToken({
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
            new EntityDeclarationPToken({
               open: SToken.fromString('<!'),
               parameter: SToken.fromString('%'),
               name: SToken.fromString('pe1'),
               value: [
                  new text.PToken({ text: SToken.fromString('pe1') }),
               ],
            }),
            new EntityDeclarationPToken({
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
            new EntityDeclarationPToken({
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
            new EntityDeclarationPToken({
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
            new EntityDeclarationPToken({
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

      it('replaces an entity reference to an external entity if validating', (done) => {
         externalMap.publicName = 'some value';
         const input = [
            new EntityDeclarationPToken({
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
            new EntityDeclarationPToken({
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
            new EntityDeclarationPToken({
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
            new EntityDeclarationPToken({
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
            expect(results[2].type).toEqual(ENTITY_DECLARATION_PTOKEN);
            expect(results[3].type).toEqual(PARAMETER_ENTITY_END_PTOKEN);
            done();
         });
      });

   });

});
