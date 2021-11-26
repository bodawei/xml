/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { ElementEndPToken } from 'token';

import { ElementContext, ValidityState } from '../common/validityState';

function elementEndUpdateState(el: ElementEndPToken, state: ValidityState): ValidityState {
   const elName = strOrBlank(el.name);
   const stack = state.elementContext.contextStack;
   const curContext = stack[stack.length - 1] as ElementContext | undefined;

   if (!curContext || elName !== curContext.parentName) {
      return state;
   }

   const elContext = { ...state.elementContext };
   const temp = [...elContext.contextStack];

   temp.pop();
   elContext.contextStack = temp;

   if (elContext.contextStack.length === 0) {
      elContext.pastEnd = true;
   }

   return {
      ...state,
      elementContext: elContext,
   };
}

export { elementEndUpdateState };
