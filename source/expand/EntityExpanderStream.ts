/* Copyright ® 2018 by David John Burrowes. All rights reserved. */

import stream from 'readable-stream';
import { Token, EntityMetaData } from 'basic';
import { EntityExpander, ExpandToken, STokenSourceProcessed, TokenProcessed } from './EntityExpander';
import { PTokenStream, PTokenFromLiteralStream } from 'pTokenStream';
import { STokenSource } from 'sToken';
import { ExpandedLiteralValuePToken } from 'source/token/entityDeclaration';
import { defaultExtractors } from 'extractor';
import { ExternalId } from 'source/token/common/externalId';

function processSTokenSource(sTokenSource: STokenSource, expandToken: ExpandToken, done: STokenSourceProcessed) {
   const pTokenStream = new PTokenStream(sTokenSource);

   pTokenStream.on('data', (token: Token) => {
      pTokenStream.pause();
      expandToken(token, () => pTokenStream.resume());
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
   return new STokenSource(defaultExtractors, entityMetaData);
}

/**********************************************************************\
 An EntityExpanderStream is simply a stream wrapper around an
 EntityExpander.
\**********************************************************************/

class EntityExpanderStream extends stream.Transform {
   private entityExpander: EntityExpander;

   constructor(validating: boolean) {
      super({
         objectMode: true,
      });

      this.entityExpander = new EntityExpander(validating, this.push.bind(this), {
         processBody: processSTokenSource,
         processForEntityValue,
         retrieveExternalEntity,
      });
   }

   _transform(token: Token, encoding: string, done: TokenProcessed) {
      this.entityExpander.expandToken(token, done);
   }
}

export {
   EntityExpanderStream,
};