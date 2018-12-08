/* Copyright ® 2018 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { Token } from "basic";
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
   ENTITY_DECLARATION_PTOKEN
} from "token";
import { EntityDeclarationPToken } from "source/token/entityDeclaration"; // @@@ TEMP

import { EntityExpander, ExpandToken } from "../EntityExpander";

import { TextPToken, TEXT_PTOKEN } from "source/token/text";
import { PTokenStream } from "pTokenStream";

describe('EntityExpander (unit)', () => {

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

   function doExpand(validate: boolean, tokens: Array<Token>, allDone: (results: Array<Token>) => void) {
      const results: Array<Token> = [];
      const unsent = tokens.slice(0);
      const entityExpander = new EntityExpander(validate, pushToken, makeContentHandler);

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
            }),
            new EntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('test'),
            })
         ];

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(2);
            expect(results[0].type).toEqual(ENTITY_DECLARATION_PTOKEN);
            expect(results[1].type).toEqual(ENTITY_DECLARATION_PTOKEN);
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
         const input = [
            new EntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('foo'),
               externalId: {},
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
         const input = [
            new EntityDeclarationPToken({
               open: SToken.fromString('<!'),
               name: SToken.fromString('foo'),
               externalId: {},
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

         doExpand(true, input, (results) => {
            expect(results.length).toEqual(3);
            expect(results[1].type).toEqual(PARAMETER_ENTITY_START_PTOKEN);
            expect(results[2].type).toEqual(PARAMETER_ENTITY_END_PTOKEN);
            done();
         });
      });

   });

});
