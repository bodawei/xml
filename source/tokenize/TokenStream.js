/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { docTypeStart, xmlDeclaration } from '../token';

class TokenStream extends stream.Transform {

   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(parsed, ignored, done) {
      switch (parsed.type) {
         case 'xmldecl':
            this.push(xmlDeclaration.makeToken(parsed));
            break;
         case 'DOCTYPE_START':
            this.push(docTypeStart.makeToken(parsed));
            break;
         default:
            this.push(parsed);
      }

      done();
   }

}

module.exports = TokenStream;
