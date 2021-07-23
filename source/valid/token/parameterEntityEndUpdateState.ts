/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ParameterEntityEndPToken, PARAMETER_ENTITY_START_PTOKEN } from 'token';

import { ValidateState } from '../validateState';

function parameterEntityEndUpdateState(
   endPToken: ParameterEntityEndPToken,
   state: ValidateState,
): ValidateState {
   let newStack = state.dtdContext.enclosingStack;
   let inParameterEntityRef = false;

   for (let index = state.dtdContext.enclosingStack.length - 1; index >= 0; index--) {
      const item = state.dtdContext.enclosingStack[index];

      if (item.type === PARAMETER_ENTITY_START_PTOKEN) {
         if (endPToken.referencePToken === item.referencePToken) {
            newStack = state.dtdContext.enclosingStack.slice(0, index);
            break;
         }
      }
   }

   for (const element of state.dtdContext.enclosingStack) {
      if (element.type === PARAMETER_ENTITY_START_PTOKEN) {
         inParameterEntityRef = true;
         break;
      }
   }

   return {
      ...state,
      dtdContext: {
         ...state.dtdContext,
         enclosingStack: newStack,
         inExternalMarkupContext: state.dtdContext.inExternalSubset || inParameterEntityRef,
      },
   };
}

export { parameterEntityEndUpdateState };
