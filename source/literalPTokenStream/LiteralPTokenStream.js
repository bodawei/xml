/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import {
   entityReference,
   text,
} from '../xToken';

class LiteralPTokenStream extends stream.Readable {

   constructor(lTokenSource, options = {}) {
      super({
         objectMode: true,
      });

      this._lTokenSource = lTokenSource;
      this._peRef = !!options.peRef;
   }

   _read() {
      this._lTokenSource.extract('peekChar', (lToken) => {
         if (!lToken) {
            this.push(null);
            return;
         }

         if (this._peRef && lToken.text === '%') {
            entityReference.paramParse(this._lTokenSource, (lToken) => this.push(lToken));
         } else {
            const terminators = [];
            if (this._peRef) {
               terminators.push('%');
            }

            text.parse(this._lTokenSource, terminators, (lToken) => this.push(lToken));
         }
      });
   }
}

export default LiteralPTokenStream;
