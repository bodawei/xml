/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import {
   entityReference,
   text,
} from '../token';

class PTokenFromLiteralStream extends stream.Readable {

   constructor(sTokenSource, options = {}) {
      super({
         objectMode: true,
      });

      this._sTokenSource = sTokenSource;
      this._peRef = !!options.peRef;
   }

   _read() {
      this._sTokenSource.extract('peekChar', (sToken) => {
         if (!sToken) {
            this.push(null);
            return;
         }

         if (this._peRef && sToken.str === '%') {
            entityReference.paramParse(this._sTokenSource, (sToken) => this.push(sToken));
         } else {
            const terminators = [];
            if (this._peRef) {
               terminators.push('%');
            }

            text.parse(this._sTokenSource, terminators, (sToken) => this.push(sToken));
         }
      });
   }
}

export default PTokenFromLiteralStream;
