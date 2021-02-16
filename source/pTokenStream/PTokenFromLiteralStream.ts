/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';

import { parseCharRef, parseInstruction, TextPToken, parseParameterEntityReference, parseText,} from 'pToken';
import { STokenSource } from 'sToken';
import {
   parseGeneralEntityReference,
} from 'token';

type Options = {
   peRef?: boolean;
   geRef?: boolean;
};

/*
 * This is used to parse EntityValue and AttributeValue literals. As such, it only
 * recognizes Text, CharRef, and (optionally) ParameterEntityReferences.
 */
class PTokenFromLiteralStream extends Transform {
   private sTokenSource: STokenSource;
   private peRef: boolean;
   private geRef: boolean;
   private terminators: Array<string>;
   private seenOneToken: boolean;

   constructor(sTokenSource: STokenSource, options: Options = {}) {
      super({
         objectMode: true,
      });

      this.sTokenSource = sTokenSource;
      this.peRef = !!options.peRef;
      this.geRef = !!options.geRef;
      this.terminators = this.peRef ? [ '&', '%' ] : [ '&' ];
      this.seenOneToken = false;
   }

   _read() {
      this.sTokenSource.extractNoParams('peekChar', (sToken) => {
         if (!sToken) {
            this.push(null);
            return;
         }

         if (!this.seenOneToken) {
            this.seenOneToken = true;

            if (sToken.str === '<') {
               this.sTokenSource.extractNoParams('peekDecl', (sToken) => {
                  if (sToken) {
                     this.sTokenSource.extract('match', '<?', (open) => {
                        parseInstruction(this.sTokenSource, open!, false, (pToken) => this.push(pToken));
                     });
                     return;
                  }

                  parseText(this.sTokenSource, this.terminators, (pToken) => {
                     this.push(pToken || null);
                  });   
               });
               return;
            }
         }

         if (this.peRef && sToken.str === '%') {
            parseParameterEntityReference(this.sTokenSource, (pToken) => this.push(pToken));
            return;
         }

         if (sToken.str !== '&') {
            parseText(this.sTokenSource, this.terminators, (pToken) => {
               this.push(pToken || null);
            });
            return;
         }

         this.sTokenSource.extract('match', '&#', (sToken) => {
            if (sToken) {
               parseCharRef(this.sTokenSource, sToken, (pToken) => this.push(pToken));
               return;
            }

            this.sTokenSource.extractNoParams('char', (sToken) => {
               if (this.geRef) {
                  parseGeneralEntityReference(this.sTokenSource, sToken!, (pToken) => this.push(pToken));
               } else {
                  this.push(new TextPToken({ text: sToken! }));
               }
            });
         });
      });
   }
}

export default PTokenFromLiteralStream;
