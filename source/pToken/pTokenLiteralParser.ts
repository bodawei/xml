/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { STokenSource } from 'sToken';

import { parseInstruction } from './bridge/instruction';
import { parseCharRef } from './token/charRef';
import { parseGeneralEntityReference } from './token/generalEntityReference';
import { parseParameterEntityReference } from './token/parameterEntityReference';
import { parseText, TextPToken } from './token/text';
import { ParseToken } from './types';

interface PTokenLiteralParserOptions {
   peRef?: boolean;
   geRef?: boolean;
}

type DeliverToken = (token: ParseToken | undefined) => void;

/*
 * This is used to parse EntityValue and AttributeValue literals. As such, it only
 * recognizes Text, CharRef, and (optionally) ParameterEntityReferences.
 */
class PTokenLiteralParser {
   private sTokenSource: STokenSource;

   private peRef: boolean;

   private geRef: boolean;

   private terminators: ReadonlyArray<string>;

   private seenFirstToken: boolean;

   constructor(sTokenSource: STokenSource, options: PTokenLiteralParserOptions = {}) {
      this.sTokenSource = sTokenSource;
      this.peRef = !!options.peRef;
      this.geRef = !!options.geRef;
      this.terminators = this.peRef ? ['&', '%'] : ['&'];
      this.seenFirstToken = false;
   }

   public parse(deliver: DeliverToken): void {
      this.sTokenSource.extractNoParams('peekChar', (sToken) => {
         const isFirstToken = this.seenFirstToken;

         if (!sToken) {
            deliver(undefined);
            return;
         }

         this.seenFirstToken = true;

         // Check for processing instructions (esp TextDeclarations)
         if (!isFirstToken && sToken.str === '<') {
            this.parsePossibleProcessingInstruction(deliver);
            return;
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
               if (!sToken) {
                  // This can only happen if something has gone drastically wrong.
                  deliver(undefined);
                  return;
               }

               if (this.geRef) {
                  parseGeneralEntityReference(this.sTokenSource, sToken, deliver);
               } else {
                  // Just deliver the single & character.
                  deliver(new TextPToken(sToken));
               }
            });
         });
      });
   }

   private parsePossibleProcessingInstruction(deliver: DeliverToken) {
      this.sTokenSource.extractNoParams('peekDecl', (sToken) => {
         if (sToken) {
            this.sTokenSource.extract('match', '<?', (open) => {
               if (!open) {
                  deliver(undefined);
               } else {
                  parseInstruction(this.sTokenSource, open, false, deliver);
               }
            });
         } else {
            parseText(this.sTokenSource, this.terminators, deliver);
         }
      });
   }
}

export { PTokenLiteralParserOptions, PTokenLiteralParser };
