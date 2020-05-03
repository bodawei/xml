/* Copyright ® 2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Token, EntityLocation, EntityMetaData, Range } from 'basic';
import { WellFormedError } from 'error';
import { defaultExtractors } from 'extractor';
import { PTokenStream, PTokenFromLiteralStream } from 'pTokenStream';
import { toSToken, SToken, STokenSource } from 'sToken';
import {
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   INTERNAL_SUBSET_START_TOKEN,
   INTERNAL_SUBSET_END_TOKEN,
   EXTERNAL_SUBSET_START_TOKEN,
   EXTERNAL_SUBSET_END_TOKEN,
   NOTATION_DECLARATION_PTOKEN,
   AttributeValuePToken,
   CharRefPToken,
   DocTypeEndPToken,
   DocTypeStartPToken,
   ElementDeclarationPToken,
   ElementStartPToken,
   ElementEmptyPToken,
   EntityValuePToken,
   ExternalId,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   GeneralEntityEndPToken,
   GeneralEntityStartPToken,
   NotationDeclarationPToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   TextPToken,
   PToken,
   XmlError,
   AttListPToken,
} from 'token';

import { EntityExpander } from '../EntityExpander';

import { ExpandToken, RetrieveResults } from '../types';

fdescribe('EntityExpander (integration)', () => {
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
   ): void {
      const pTokenStream = new PTokenFromLiteralStream(sTokenSource, { peRef: false });
      const results: AttributeValuePToken = [];

      pTokenStream.on('data', (token: Token) => {
         results.push(token as any);
      });
      pTokenStream.on('end', () => {
         done(results, []);
      });
   }

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

   it('expands general entity references in attributes', (done) => {
      const decl0 = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('second'),
         value: [new TextPToken('middle')],
      });
      const decl1 = new GeneralEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('first'),
         value: [
            new TextPToken('('),
            new ParameterEntityReferencePToken({
               open: toSToken('%'),
               name: toSToken('second'),
            }),
            new TextPToken(')'),
         ],
      });
      const start = new ElementStartPToken({
         open: toSToken('<'),
         name: toSToken('expandTest'),
         attributes: [
            {
               name: toSToken('one'),
               value: [
                  new GeneralEntityReferencePToken({
                     open: toSToken('&'),
                     name: toSToken('first'),
                  }),
               ],
            },
         ],
      });
      const ref1 = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('first'),
      });
      const expanded = new ElementStartPToken({
         open: toSToken('<'),
         name: toSToken('expandTest'),
         attributes: [
            {
               name: toSToken('one'),
               value: [
                  new GeneralEntityStartPToken(ref1),
                  new TextPToken({
                     text: new SToken(
                        '(middle)',
                        '(middle)',
                        new Range(
                           new EntityLocation('dummy meta data to keep TypeScript happy'),
                           0,
                           0,
                           0,
                           8,
                           0,
                           8,
                        ),
                     ),
                  }),
                  new GeneralEntityEndPToken(ref1),
               ],
            },
         ],
      });

      doExpand([decl0, decl1, start], true, (results) => {
         expect(results).toEqual([decl0, decl1, expanded]);
         done();
      });
   });
});
