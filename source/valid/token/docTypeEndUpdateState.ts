/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { DocTypeEndPToken, DOCTYPE_START_PTOKEN } from 'token';

import { ValidateState } from '../validateState';

function docTypeEndUpdateState(
   docTypeEndPToken: DocTypeEndPToken,
   state: ValidateState,
): ValidateState {
   let newStack = state.dtdContext.enclosingStack;

   for (let index = state.dtdContext.enclosingStack.length - 1; index >= 0; index--) {
      const item = state.dtdContext.enclosingStack[index];

      if (item.type === DOCTYPE_START_PTOKEN) {
         newStack = state.dtdContext.enclosingStack.slice(0, index);
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

export { docTypeEndUpdateState };
