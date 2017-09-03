/* Copyright ® 2017 by 柏大衛. All rights reserved. */

const stream = require('readable-stream');

const token = require('../xmlToken');

class TokenStream extends stream.Transform {

   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(parsed, ignored, done) {
      switch (parsed.type) {
         case 'xmldecl':
            this.push(token.XmlDeclaration.makeToken(parsed));
            break;
         case 'DOCTYPE_START':
            this.push(token.docTypeStart.makeToken(parsed));
            break;
         default:
            this.push(parsed);
      }

      done();
   }

}

module.exports = TokenStream;
