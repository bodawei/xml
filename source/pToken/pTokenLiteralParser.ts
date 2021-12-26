/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import {
   ParseToken,
   parseInstruction,
   parseParameterEntityReference,
   parseGeneralEntityReference,
   TextPToken,
   parseCharRef,
   parseText,
} from 'pToken';
import { STokenSource } from 'sToken';

interface Options {
   peRef?: boolean;
   geRef?: boolean;
}

/*
 * This is used to parse EntityValue and AttributeValue literals. As such, it only
 * recognizes Text, CharRef, and (optionally) ParameterEntityReferences.
 */
class PTokenLiteralParser {
   private sTokenSource: STokenSource;

   private peRef: boolean;

   private geRef: boolean;

   private terminators: Array<string>;

   private seenOneToken: boolean;

   constructor(sTokenSource: STokenSource, options: Options = {}) {
      this.sTokenSource = sTokenSource;
      this.peRef = !!options.peRef;
      this.geRef = !!options.geRef;
      this.terminators = this.peRef ? ['&', '%'] : ['&'];
      this.seenOneToken = false;
   }

   parse(deliver: (token: ParseToken | undefined) => void): void {
      this.sTokenSource.extractNoParams('peekChar', (sToken) => {
         if (!sToken) {
            deliver(undefined);
            return;
         }

         if (!this.seenOneToken) {
            this.seenOneToken = true;

            if (sToken.str === '<') {
               this.sTokenSource.extractNoParams('peekDecl', (sToken) => {
                  if (sToken) {
                     this.sTokenSource.extract('match', '<?', (open) => {
                        parseInstruction(this.sTokenSource, open!, false, deliver);
                     });
                     return;
                  }

                  parseText(this.sTokenSource, this.terminators, deliver);
               });
               return;
            }
         }

         if (this.peRef && sToken.str === '%') {
            parseParameterEntityReference(this.sTokenSource, deliver);
            return;
         }

         if (sToken.str !== '&') {
            parseText(this.sTokenSource, this.terminators, deliver);
            return;
         }

         this.sTokenSource.extract('match', '&#', (sToken) => {
            if (sToken) {
               parseCharRef(this.sTokenSource, sToken, deliver);
               return;
            }

            this.sTokenSource.extractNoParams('char', (sToken) => {
               if (this.geRef) {
                  parseGeneralEntityReference(this.sTokenSource, sToken!, deliver);
               } else {
                  deliver(new TextPToken({ text: sToken! }));
               }
            });
         });
      });
   }
}

export { PTokenLiteralParser };
