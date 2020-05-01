/* Copyright ® 2018-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Token, EntityMetaData } from 'basic';
import { defaultExtractors } from 'extractor';
import { PTokenStream, PTokenFromLiteralStream } from 'pTokenStream';
import { SToken, STokenSource } from 'sToken';
import {
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   INTERNAL_SUBSET_START_TOKEN,
   INTERNAL_SUBSET_END_TOKEN,
   EXTERNAL_SUBSET_START_TOKEN,
   EXTERNAL_SUBSET_END_TOKEN,
   NOTATION_DECLARATION_PTOKEN,
   AttributeValuePToken,
   DocTypeEndPToken,
   DocTypeStartPToken,
   ElementDeclarationPToken,
   EntityValuePToken,
   ExternalId,
   NotationDeclarationPToken,
   TextPToken,
   PToken,
   XmlError,
} from 'token';

import { EntityExpander } from '../EntityExpander2';

import { ExpandToken, RetrieveResults } from '../types';

fdescribe('EntityExpander (unit)', () => {
   const externalMap: { [publicName: string]: string } = {};

   function parseBody(
      sTokenSource: STokenSource,
      inContent: boolean,
      writeToken: ExpandToken,
      done: () => void,
   ): void {
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

   function parseEntityValue(
      sTokenSource: STokenSource,
      done: (results: EntityValuePToken | void) => void,
   ): void {
      const pTokenStream = new PTokenFromLiteralStream(sTokenSource, { peRef: true });
      const results: EntityValuePToken = [];

      pTokenStream.on('data', (token: Token) => {
         results.push(token as any);
      });
      pTokenStream.on('end', () => {
         done(results);
      });
   }

   function retrieveExternalEntity(
      externalId: ExternalId,
      entityMetaData: EntityMetaData,
   ): RetrieveResults {
      const sTokenSource = new STokenSource(defaultExtractors, entityMetaData);

      const str = externalMap[(externalId.system!.value[0] as any).text.str];
      sTokenSource.addText(str);
      sTokenSource.endText();

      return {
         sTokenSource,
         getErrors(): Array<XmlError> {
            return [];
         },
      };
   }

   function parseAttributeValue(
      sTokenSource: STokenSource,
      done: (results: AttributeValuePToken | void, errors: Array<XmlError>) => void,
   ): void {}

   function doExpand(
      tokens: Array<Token>,
      validate: boolean,
      allDone: (results: Array<Token>) => void,
   ): void {
      const results: Array<Token> = [];
      const unsent = tokens.slice(0);

      function pushToken(result: Token | void): boolean {
         if (result) {
            results.push(result);
         }

         return true;
      }

      const entityExpander = new EntityExpander(validate, pushToken, {
         parseBody,
         parseEntityValue,
         retrieveExternalEntity,
         parseAttributeValue,
      });

      function processNextToken(): void {
         if (unsent.length === 0) {
            allDone(results);

            return;
         }

         const nextToken = unsent[0];
         unsent.shift();

         entityExpander.expandToken(nextToken as any, processNextToken);
      }

      processNextToken();
   }

   describe('DOCTYPE declaration', () => {
      let docTypeStart: DocTypeStartPToken;
      let docTypeEnd: DocTypeEndPToken;

      beforeEach(() => {
         docTypeStart = new DocTypeStartPToken({
            open: SToken.fromString('<!'),
            name: SToken.fromString('root'),
         });
         docTypeEnd = new DocTypeEndPToken({
            docTypeStartPToken: docTypeStart,
            close: SToken.fromString('>'),
         });
      });

      it('adds no internal or external entity markers if there are none', (done) => {
         const input = [docTypeStart, docTypeEnd];

         doExpand(input, true, (results) => {
            const types = results.map((element) => element.type);

            expect(types).toEqual([DOCTYPE_START_PTOKEN, DOCTYPE_END_PTOKEN]);
            done();
         });
      });

      it('adds an internal subset markers when there is an internal subset that is empty', (done) => {
         docTypeStart = new DocTypeStartPToken({
            open: SToken.fromString('<!'),
            name: SToken.fromString('root'),
            openSubset: SToken.fromString('['),
         });
         const input = [docTypeStart, docTypeEnd];

         doExpand(input, true, (results) => {
            const types = results.map((element) => element.type);

            expect(types).toEqual([
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
            open: SToken.fromString('<!'),
            name: SToken.fromString('root'),
            openSubset: SToken.fromString('['),
         });
         const notation = new NotationDeclarationPToken({ open: SToken.fromString('<!') });
         const input = [docTypeStart, notation, docTypeEnd];

         doExpand(input, true, (results) => {
            const types = results.map((element) => element.type);

            expect(types).toEqual([
               DOCTYPE_START_PTOKEN,
               INTERNAL_SUBSET_START_TOKEN,
               NOTATION_DECLARATION_PTOKEN,
               INTERNAL_SUBSET_END_TOKEN,
               DOCTYPE_END_PTOKEN,
            ]);
            done();
         });
      });

      it('adds external subset markers when there is an externalId', (done) => {
         docTypeStart = new DocTypeStartPToken({
            open: SToken.fromString('<!'),
            name: SToken.fromString('root'),
            externalId: {
               system: {
                  value: [new TextPToken({ text: SToken.fromString('systemFoo') })],
               },
            },
         });
         const input = [docTypeStart, docTypeEnd];

         doExpand(input, true, (results) => {
            const types = results.map((element) => element.type);

            expect(types).toEqual([
               DOCTYPE_START_PTOKEN,
               EXTERNAL_SUBSET_START_TOKEN,
               EXTERNAL_SUBSET_END_TOKEN,
               DOCTYPE_END_PTOKEN,
            ]);
            done();
         });
      });

      it('adds an internal and external subset markers if both are there', (done) => {
         const notation = new NotationDeclarationPToken({ open: SToken.fromString('<!') });
         docTypeStart = new DocTypeStartPToken({
            open: SToken.fromString('<!'),
            name: SToken.fromString('root'),
            openSubset: SToken.fromString('['),
            externalId: {
               system: {
                  value: [new TextPToken({ text: SToken.fromString('systemFoo') })],
               },
            },
         });
         const input = [docTypeStart, notation, docTypeEnd];

         doExpand(input, true, (results) => {
            const types = results.map((element) => element.type);

            expect(types).toEqual([
               DOCTYPE_START_PTOKEN,
               INTERNAL_SUBSET_START_TOKEN,
               NOTATION_DECLARATION_PTOKEN,
               INTERNAL_SUBSET_END_TOKEN,
               EXTERNAL_SUBSET_START_TOKEN,
               EXTERNAL_SUBSET_END_TOKEN,
               DOCTYPE_END_PTOKEN,
            ]);
            done();
         });
      });

      it('dos not add external subset markers if this is not a validating processor', (done) => {
         const notation = new NotationDeclarationPToken({ open: SToken.fromString('<!') });
         docTypeStart = new DocTypeStartPToken({
            open: SToken.fromString('<!'),
            name: SToken.fromString('root'),
            openSubset: SToken.fromString('['),
            externalId: {
               system: {
                  value: [new TextPToken({ text: SToken.fromString('systemFoo') })],
               },
            },
         });
         const input = [docTypeStart, notation, docTypeEnd];

         doExpand(input, false, (results) => {
            const types = results.map((element) => element.type);

            expect(types).toEqual([
               DOCTYPE_START_PTOKEN,
               INTERNAL_SUBSET_START_TOKEN,
               NOTATION_DECLARATION_PTOKEN,
               INTERNAL_SUBSET_END_TOKEN,
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
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: SToken.fromString('<!'),
            name: SToken.fromString('test'),
            externalId: {
               type: 'EXTERNAL_ID',
            },
         });
      });

      it('passes a declaration with no unassigned values through without changes', (done) => {
         const input = [notation];

         doExpand(input, true, (results) => {
            expect(results).toEqual([notation]);
            done();
         });
      });
   });

   describe('ELEMENT declaration', () => {
      let elementDecl: ElementDeclarationPToken;

      beforeEach(() => {
         elementDecl = new ElementDeclarationPToken({
            open: SToken.fromString('<!'),
            name: SToken.fromString('student'),
         });
      });

      it('passes a declaration with no unassigned values through without changes', (done) => {
         const input = [elementDecl];

         doExpand(input, true, (results) => {
            expect(results).toEqual([elementDecl]);
            done();
         });
      });
   });
});
