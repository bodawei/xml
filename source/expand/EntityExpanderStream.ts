/* Copyright ® 2018-2019 by 柏大衛. All rights reserved. */

import fs from 'fs';
import { Transform } from 'stream';
import { EntityMetaData } from 'basic';
import { defaultExtractors } from 'extractor';
import { EntityExpander } from 'expand';
import { PTokenStream, PTokenFromLiteralStream } from 'pTokenStream';
import { STokenSource } from 'sToken';
import { AttributeValuePToken, EntityValuePToken, ExternalId, PToken, XmlError } from 'token';

import { ExpandToken, RetrieveResults } from './types';

function parseBody(sTokenSource: STokenSource, inContent: boolean, expandToken: ExpandToken): void {
   const pTokenStream = new PTokenStream(sTokenSource);

   (pTokenStream as any)._inContent = inContent;

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
      // typehack
      results.push(token);
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

   // eslint-disable-next-line
   const path = (externalId as any).system.value[0].text.str;

   const data = fs.readFileSync(path, { encoding: 'utf8' });

   sTokenSource.addText(data);
   sTokenSource.endText();

   return {
      sTokenSource,
      getErrors: (): Array<XmlError> => [],
   };
}

function parseAttributeValue(
   sTokenSource: STokenSource,
   done: (results: AttributeValuePToken | void, errors: Array<XmlError>) => void,
): void {
   const pTokenStream = new PTokenFromLiteralStream(sTokenSource, { peRef: false });
   const results: AttributeValuePToken = [];

   pTokenStream.on('data', (token: any) => {
      // typehack
      results.push(token);
   });
   pTokenStream.on('end', () => {
      done(results, []);
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
         retrieveExternalEntity,
         parseAttributeValue,
      });
   }

   _transform(token: PToken, encoding: string, done: () => void): void {
      this.entityExpander.expandToken(token, done);
   }
}

export { EntityExpanderStream };
