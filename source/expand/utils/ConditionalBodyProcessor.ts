/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { XML_ERROR_TOKEN } from 'basic';

import { ParseToken, TEXT_PTOKEN } from 'pToken';
import { STokenSource, strOrBlank } from 'sToken';
import { CONDITIONAL_START_PTOKEN } from 'token';
type PTokenExpanded = () => void;
type DeliverPToken = (token: ParseToken | undefined, expanded: PTokenExpanded) => void;
type DoTextExpansion = (sTokenSource: STokenSource, handleNextToken: DeliverPToken) => void;

interface FinalCallback {
   pToken: ParseToken;
   expanded: PTokenExpanded;
}

interface IncludeConditional {
   isInclude: boolean;
   wrapUp?: FinalCallback;
}

class ConditionalBodyProcessor {
   private atEnd: boolean;

   private expandToken: DeliverPToken;

   private source: STokenSource;

   private expansionStack: Array<IncludeConditional>;

   constructor(
      startingText: STokenSource,
      bodyProcessor: DoTextExpansion,
      expandToken: DeliverPToken,
   ) {
      this.atEnd = false;
      this.expandToken = expandToken;

      this.expansionStack = [{ isInclude: true }];
      this.source = new STokenSource(startingText);

      bodyProcessor(this.source, this.handleParsedToken.bind(this));
   }

   get isDone(): boolean {
      return this.atEnd;
   }

   /*
    * Handle the next token in the input stream.
    * We expect: Text ptokens, conditional end, and of a subset, We theoretically ight get an error
    * and theoretically might get other tokens.
    *
    * We will be in the middle of processing an include or ignore
    * conditional section.
    *
    * If it is an error, just pass it along without changing anything
    * (this might change the position of the error, slgithtly if we are in
    * the middle of including some text)
    *
    * If it is a conditional end, then this is the end of all the conditionals.
    * (the input parser, once it has fond <![, then it finds only text until
    * it finds the balancing ]]> which is parsed as a conditionalEnd and
    * passed here).
    *
    * If it is anything else, assume the whole stack of conditionals are
    * done.
    */
   public handleToken(pToken: ParseToken, expanded: PTokenExpanded): void {
      const current = this.expansionStack[this.expansionStack.length - 1];

      // this should never happen.
      if (this.atEnd) {
         this.expandToken(pToken, expanded);
         return;
      }

      switch (pToken.type) {
         case XML_ERROR_TOKEN:
            this.expandToken(pToken, expanded);
            break;
         case TEXT_PTOKEN:
            this.source.addText(strOrBlank(pToken.text));
            expanded();
            return;
         default:
            this.atEnd = true;
            current.wrapUp = { pToken, expanded };
            this.source.endText();
            return;
      }
   }

   private handleParsedToken(newToken: ParseToken | undefined, handled: () => void): void {
      const current = this.expansionStack[this.expansionStack.length - 1];

      if (!newToken) {
         if (current.wrapUp) {
            const wrapUp = current.wrapUp;

            this.expandToken(wrapUp.pToken, () => {
               this.expansionStack.pop();
               this.atEnd = this.expansionStack.length === 0;
               wrapUp.expanded();
               handled();
            });
         } else {
            this.expansionStack.pop();
            this.atEnd = this.expansionStack.length === 0;
            handled();
         }
         return;
      }

      if (newToken.type !== CONDITIONAL_START_PTOKEN) {
         this.expandToken(newToken, handled);
      } else {
         this.expandToken(newToken, handled);
      }
   }
}

export { ConditionalBodyProcessor };

// Tests
// - Call with not-include
//    - without following text
//    - with following text
// - Call with include
//    - without following text
//    - with following text
//
// - follow with more text
// - follow that with ConditionalEnd
// - follow that with OtherToken
