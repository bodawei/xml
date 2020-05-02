/* Copyright ® 2018-2019 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';
import { Token, EntityMetaData } from 'basic';
import {
   EntityExpander,
   ExpandToken,
   STokenSourceProcessed,
   TokenProcessed,
} from './EntityExpander-draft2';
import { PTokenStream, PTokenFromLiteralStream } from 'pTokenStream';
import { STokenSource } from 'sToken';
import { EntityValuePToken } from 'source/token/entityDeclaration';
import { defaultExtractors } from 'extractor';
import { ExternalId } from 'source/token/common/externalId';

function processSTokenSource(
   sTokenSource: STokenSource,
   inContent: boolean,
   expandToken: ExpandToken,
   done: STokenSourceProcessed,
) {
   const pTokenStream = new PTokenStream(sTokenSource);

   (pTokenStream as any)._inContent = inContent;

   pTokenStream.on('data', (token: Token) => {
      pTokenStream.pause();
      expandToken(token as any, () => pTokenStream.resume());
   });
   pTokenStream.on('end', () => {
      done();
   });
}

function processForEntityValue(
   sTokenSource: STokenSource,
   done: (result: EntityValuePToken) => void,
) {
   const pTokenStream = new PTokenFromLiteralStream(sTokenSource, { peRef: true });
   const results: EntityValuePToken = [];

   pTokenStream.on('data', (token: Token) => {
      results.push(token as any);
   });
   pTokenStream.on('end', () => {
      done(results);
   });
}

function retrieveExternalEntity(externalId: ExternalId, entityMetaData: EntityMetaData) {
   const source = new STokenSource(defaultExtractors, entityMetaData);
   source.addText('!placeholder!');
   source.endText();

   return source;
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
         processBody: processSTokenSource,
         processForEntityValue,
         retrieveExternalEntity,
      });
   }

   _transform(token: Token, encoding: string, done: TokenProcessed) {
      this.entityExpander.expandToken(token, done);
   }
}

export { EntityExpanderStream };
