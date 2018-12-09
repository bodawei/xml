/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { STokenSource } from '../sToken';
import {
   charRef,
   parseParameterEntityReference,
   text,
} from '../token';

type Options = {
   peRef?: boolean;
};

/*
 * This is used to parse EntityValue and AttributeValue literals. As such, it only
 * recognizes Text, CharRef, and (optionally) ParameterEntityReferences.
 */
class PTokenFromLiteralStream extends stream.Transform {
   private sTokenSource: STokenSource;
   private peRef: boolean;
   private terminators: Array<string>;

   constructor(sTokenSource: STokenSource, options: Options = {}) {
      super({
         objectMode: true,
      });

      this.sTokenSource = sTokenSource;
      this.peRef = !!options.peRef;
      this.terminators = this.peRef ? [ '&', '%' ] : [ '&' ];
   }

   _read() {
      this.sTokenSource.extractNoParams('peekChar', (sToken) => {
         if (!sToken) {
            this.push(null);
            return;
         }

         if (this.peRef && sToken.str === '%') {
            parseParameterEntityReference(this.sTokenSource, (pToken) => this.push(pToken));
            return;
         }

         if (sToken.str !== '&') {
            text.parse(this.sTokenSource, this.terminators, (pToken) => this.push(pToken));
            return;
         }

         this.sTokenSource.extract('match', '&#', (sToken) => {
            if (sToken) {
               charRef.parse(this.sTokenSource, sToken, (pToken) => this.push(pToken));
               return;
            }

            this.sTokenSource.extractNoParams('char', (sToken) => {
               this.push(new text.PToken({ text: sToken! }));
            });
         });
      });
   }
}

export default PTokenFromLiteralStream;
