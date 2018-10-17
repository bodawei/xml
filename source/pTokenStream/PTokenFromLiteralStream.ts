/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { STokenSource } from '../sToken';
import {
   entityReference,
   text,
} from '../token';

type Options = {
   peRef?: boolean;
};

class PTokenFromLiteralStream extends stream.Transform {
   private sTokenSource: STokenSource;
   private peRef: boolean;

   constructor(sTokenSource: STokenSource, options: Options = {}) {
      super({
         objectMode: true,
      });

      this.sTokenSource = sTokenSource;
      this.peRef = !!options.peRef;
   }

   _read() {
      this.sTokenSource.extractNoParams('peekChar', (sToken) => {
         if (!sToken) {
            this.push(null);
            return;
         }

         if (this.peRef && sToken.str === '%') {
            entityReference.paramParse(this.sTokenSource, (sToken) => this.push(sToken));
         } else {
            const terminators = [];
            if (this.peRef) {
               terminators.push('%');
            }

            text.parse(this.sTokenSource, terminators, (sToken) => this.push(sToken));
         }
      });
   }
}

export default PTokenFromLiteralStream;
