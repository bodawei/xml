/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ConditionalEndPToken, CONDITIONAL_START_PTOKEN } from 'token';

import { ValidityState } from '../common/validityState';

function conditionalEndUpdateState(
   token: ConditionalEndPToken,
   state: ValidityState,
): ValidityState {
   let newStack = state.dtdContext.enclosingStack;

   for (let index = state.dtdContext.enclosingStack.length - 1; index >= 0; index--) {
      const item = state.dtdContext.enclosingStack[index];

      if (item.type === CONDITIONAL_START_PTOKEN) {
         newStack = state.dtdContext.enclosingStack.slice(0, index);
         break;
      }
   }

   return new ValidityState(state, {
      dtdContext: {
         ...state.dtdContext,
         enclosingStack: newStack,
      },
   });
}

export { conditionalEndUpdateState };
