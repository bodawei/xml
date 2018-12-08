/* Copyright ® 2018 by David John Burrowes. All rights reserved. */

import stream from 'readable-stream';
import { Token } from 'basic';
import { EntityExpander, ExpandToken, STokenSourceProcessed, TokenProcessed } from './EntityExpander';
import { PTokenStream } from 'pTokenStream';
import { STokenSource } from 'sToken';

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

      this.entityExpander = new EntityExpander(validating, this.push.bind(this), processSTokenSource);
   }

   _transform(token: Token, encoding: string, done: TokenProcessed) {
      this.entityExpander.expandToken(token, done);
   }
}

export {
   EntityExpanderStream,
};