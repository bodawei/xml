/* Copyright ® 2018-2019 by 柏大衛. All rights reserved. */

import fs from 'fs';
import { resolve } from 'path';
import { Transform } from 'stream';
import { EntityId } from 'basic';
import { defaultExtractors } from 'extractor';
import { EntityExpander, resolveEntityId as defaultResolveEntityId } from 'expand';
import { PTokenStream, PTokenFromLiteralStream } from 'pTokenStream';
import { STokenSource } from 'sToken';
import { AttributeValuePToken, EntityValuePToken, PToken, XmlError } from 'token';

import { AttributeValueResults, ExpandToken, OpaqueEntityLoc, RetrieveResults } from '../expand/types';
import { ContextType } from 'pToken';

function parseBody(sTokenSource: STokenSource, context: ContextType, expandToken: ExpandToken): void {
   const pTokenStream = new PTokenStream(sTokenSource, { context });

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
   done: (results: EntityValuePToken | void) => void,
): void {
   const pTokenStream = new PTokenFromLiteralStream(sTokenSource, { peRef: true });
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
   let pathname = defaultResolveEntityId(baseEntity, relativeEntity);
   pathname = resolve(pathname);

   return pathname;
}

function retrieveExternalEntity(
   entityLoc: OpaqueEntityLoc,
): RetrieveResults {
   const sTokenSource = new STokenSource(defaultExtractors);

   const data = fs.readFileSync(entityLoc, { encoding: 'utf8' });

   sTokenSource.addText(data);
   sTokenSource.endText();

   return {
      sTokenSource,
      getErrors: (): Array<XmlError> => [],
   };
}

function parseAttributeValue(
   sTokenSource: STokenSource,
   done: (results: AttributeValueResults) => void,
): void {
   const pTokenStream = new PTokenFromLiteralStream(sTokenSource, { peRef: false, geRef: true });
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
