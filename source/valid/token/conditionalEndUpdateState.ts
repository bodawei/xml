/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ConditionalClosePToken, CONDITIONAL_PTOKEN } from 'token';

import { ValidateState } from '../common/validateState';

function conditionalEndUpdateState(
   token: ConditionalClosePToken,
   state: ValidateState,
): ValidateState {
   let newStack = state.dtdContext.enclosingStack;

   for (let index = state.dtdContext.enclosingStack.length - 1; index >= 0; index--) {
      const item = state.dtdContext.enclosingStack[index];

      if (item.type === CONDITIONAL_PTOKEN) {
         newStack = state.dtdContext.enclosingStack.slice(0, index);
         break;
      }
   }

   return {
      ...state,
      dtdContext: {
         ...state.dtdContext,
         enclosingStack: newStack,
      },
   };
}

export { conditionalEndUpdateState };
