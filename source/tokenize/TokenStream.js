/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import {
   docTypeStart,
   docTypeEnd,
   xmlDeclaration,
   entityDeclaration,
} from '../token';

class TokenStream extends stream.Transform {

   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(parsed, ignored, done) {
      switch (parsed.type) {
         case xmlDeclaration.TYPE:
            this.push(xmlDeclaration.makeToken(parsed));
            break;
         case docTypeStart.TYPE:
            this.push(docTypeStart.makeToken(parsed));
            break;
         case docTypeEnd.TYPE:
            this.push(docTypeEnd.makeToken(parsed));
            break;
         case entityDeclaration.TYPE:
            this.push(entityDeclaration.makeToken(parsed));
            break;
         default:
            this.emit('error', new Error(`Unknown parsed type "${parsed.type}" encountered.`));
      }

      done();
   }

}

export default TokenStream;
