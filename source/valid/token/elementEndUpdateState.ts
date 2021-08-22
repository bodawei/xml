/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { ElementEndPToken } from 'token';

import { ValidityState } from '../common/validityState';

function elementEndUpdateState(el: ElementEndPToken, state: ValidityState): ValidityState {
   const elName = strOrBlank(el.name);
   const context = state.elementContext.activeContext;

   if (!context || elName !== context.parentName) {
      return state;
   }

   const elContext = { ...state.elementContext };
   const temp = [...elContext.contextStack];

   temp.pop();
   elContext.activeContext = temp[temp.length - 1];
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
