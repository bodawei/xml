/* Copyright ® 2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Token, Range, EntityId, ENTITY_ID, Problem } from 'basic';
import {
   ParseType,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   TextPToken,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
} from 'pToken';
import { PTokenStream, PTokenLiteralStream } from 'node';
import { toSToken, SToken, STokenSource } from 'sToken';
import {
   AttributeValuePToken,
   ElementStartPToken,
   EntityValuePToken,
   GeneralEntityEndPToken,
   GeneralEntityStartPToken,
   PToken,
   PARAMETER_ENTITY_START_PTOKEN,
   COMMENT_PTOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
} from 'token';

import { EntityExpander } from '../EntityExpander';

import { AttributeValueResults, ExpandToken, OpaqueEntityLoc, RetrieveResults } from '../types';

describe('EntityExpander (integration)', () => {
   const externalMap: { [publicName: string]: string } = {};

   function parseBody(
      sTokenSource: STokenSource,
      context: ParseType,
      writeToken: ExpandToken,
   ): void {
      const pTokenStream = new PTokenStream(sTokenSource, {
         parseType: context,
      });
      let ended = false;
      let writing = false;

      pTokenStream.on('data', (token: PToken) => {
         pTokenStream.pause();
         writing = true;
         writeToken(token, () => {
            writing = false;
            pTokenStream.resume();
            if (ended) {
               writeToken(undefined, () => {});
            }
         });
      });
      pTokenStream.on('end', () => {
         ended = true;
         if (!writing) {
            writeToken(undefined, () => {});
         }
      });
   }

   function parseEntityValue(
      sTokenSource: STokenSource,
      done: (results: EntityValuePToken | undefined) => void,
   ): void {
      const pTokenStream = new PTokenLiteralStream(sTokenSource, { peRef: true });
      const results: EntityValuePToken = [];

      pTokenStream.on('data', (token: Token) => {
         results.push(token as any);
      });
      pTokenStream.on('end', () => {
         done(results);
      });
   }

   function resolveEntityId(
      baseEntity: EntityId | OpaqueEntityLoc,
      relativeEntity: EntityId,
   ): OpaqueEntityLoc {
      const base = baseEntity.type === ENTITY_ID ? baseEntity.systemId : baseEntity;

      return `${base}/${relativeEntity.systemId}`;
   }

   function retrieveExternalEntity(entityLoc: OpaqueEntityLoc): RetrieveResults {
      const sTokenSource = new STokenSource(entityLoc.relativeEntity);

      const str = externalMap[entityLoc];
      sTokenSource.addText(str);
      sTokenSource.endText();

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
      const pTokenStream = new PTokenLiteralStream(sTokenSource, { peRef: false });
      const results: AttributeValuePToken = [];

      pTokenStream.on('data', (token: Token) => {
         results.push(token as any);
      });
      pTokenStream.on('end', () => {
         done({ newValue: results, errors: [] });
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
         resolveEntityId,
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

         entityExpander.expandPToken(nextToken as any, processNextToken);
      }

      processNextToken();
   }

   it('expands general entity references in attributes', (done) => {
      const decl0 = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('second'),
         value: [new TextPToken(toSToken('middle'))],
      });
      const decl1 = new GeneralEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('first'),
         value: [
            new TextPToken(toSToken('(')),
            new ParameterEntityReferencePToken({
               open: toSToken('%'),
               name: toSToken('second'),
            }),
            new TextPToken(toSToken(')')),
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
                        new Range(new EntityId(), 0, 0, 0, 8, 0, 8),
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

   it('expands an entity which references another which references another via relative refs', (done) => {
      externalMap['./someOther/sub.xml'] = '<!ENTITY % two PUBLIC "xx" "./other.xml">%two;';
      externalMap['./someOther/sub.xml/./other.xml'] = '<!-- Success -->';
      const baseEntity = new EntityId('.');
      const decl0 = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('first'),
         externalId: {
            system: {
               value: [new TextPToken({ text: toSToken('someOther/sub.xml') })],
            },
         },
      });
      const ref0 = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('first'),
      });

      doExpand([baseEntity, decl0, ref0], true, (results) => {
         const types = results.map((r) => r.type);
         expect(types).toEqual([
            ENTITY_ID,
            PARAMETER_ENTITY_DECLARATION_PTOKEN,
            PARAMETER_ENTITY_START_PTOKEN,
            PARAMETER_ENTITY_DECLARATION_PTOKEN,
            PARAMETER_ENTITY_START_PTOKEN,
            COMMENT_PTOKEN,
            PARAMETER_ENTITY_END_PTOKEN,
            PARAMETER_ENTITY_END_PTOKEN,
         ]);
         done();
      });
   });
});
