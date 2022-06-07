/* Copyright ® 2018-2019 by 柏大衛. All rights reserved. */

import fs from 'fs';
import { resolve } from 'path';
import { Transform } from 'stream';
import { EntityId, Problem } from 'basic';
import { PTokenLiteralStream } from './pTokenLiteralStream';
import { PTokenStream } from './pTokenStream';
import { EntityExpander, resolveEntityId as defaultResolveEntityId } from 'expand';
import { STokenSource } from 'sToken';
import { AttributeValuePToken, EntityValuePToken, PToken } from 'token';

import { AttributeValueResults, ExpandToken, OpaqueEntityLoc, RetrieveResults } from '../expand/types';
import { ParseType } from 'pToken';

function parseBody(sTokenSource: STokenSource, context: ParseType, expandToken: ExpandToken): void {
   const pTokenStream = new PTokenStream(sTokenSource, { parseType: context });

   pTokenStream.on('data', (token: PToken) => {
      pTokenStream.pause();
      expandToken(token, () => pTokenStream.resume());
   });
   pTokenStream.on('end', () => {
      expandToken(undefined, () => {
         // do nothing
      });
   });
}

function parseEntityValue(
   sTokenSource: STokenSource,
   done: (results: EntityValuePToken | undefined) => void,
): void {
   const pTokenStream = new PTokenLiteralStream(sTokenSource, { peRef: true });
   const results: EntityValuePToken = [];

   pTokenStream.on('data', (token: any) => {
      results.push(token);
   });
   pTokenStream.on('end', () => {
      done(results);
   });
}

function resolveEntityId(
   baseEntity: EntityId | OpaqueEntityLoc,
   relativeEntity: EntityId,
): OpaqueEntityLoc {
   let pathname = defaultResolveEntityId(baseEntity, relativeEntity) as string;
   pathname = resolve(pathname);

   return pathname;
}

function retrieveExternalEntity(
   entityLoc: OpaqueEntityLoc,
): RetrieveResults {
   const sTokenSource = new STokenSource();

   const data = fs.readFileSync(entityLoc as string, { encoding: 'utf8' });

   sTokenSource.addText(data);
   sTokenSource.endText();

   return {
      sTokenSource,
      getErrors: (): Array<Problem> => [],
   };
}

function parseAttributeValue(
   sTokenSource: STokenSource,
   done: (results: AttributeValueResults) => void,
): void {
   const pTokenStream = new PTokenLiteralStream(sTokenSource, { peRef: false, geRef: true });
   const results: AttributeValuePToken = [];

   pTokenStream.on('data', (token: any) => {
      // typehack
      results.push(token);
   });
   pTokenStream.on('end', () => {
      done({ newValue: results, errors: [] });
   });
}

/**********************************************************************\
 An EntityExpanderStream is simply a stream wrapper around an
 EntityExpander.
\**********************************************************************/

class EntityExpanderStream extends Transform {
   private entityExpander: EntityExpander;

   constructor(validating: boolean) {
      super({
         objectMode: true,
      });

      this.entityExpander = new EntityExpander(validating, this.push.bind(this), {
         parseBody,
         parseEntityValue,
         resolveEntityId,
         retrieveExternalEntity,
         parseAttributeValue,
      });
   }

   _transform(token: PToken, encoding: string, done: () => void): void {
      this.entityExpander.expandPToken(token, done);
   }
}

export { EntityExpanderStream };
