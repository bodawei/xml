/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ConditionalPToken } from 'token';

import { ValidityState } from '../common/validityState';

function conditionalStartUpdateState(
   token: ConditionalPToken,
   state: ValidityState,
): ValidityState {
   return {
      ...state,
      dtdContext: {
         ...state.dtdContext,
         enclosingStack: [...state.dtdContext.enclosingStack, token],
      },
   };
}

export { conditionalStartUpdateState };
