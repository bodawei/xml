/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ConditionalPToken } from 'token';

import { ValidateState } from '../common/validateState';

function conditionalStartUpdateState(
   token: ConditionalPToken,
   state: ValidateState,
): ValidateState {
   return {
      ...state,
      dtdContext: {
         ...state.dtdContext,
         enclosingStack: [...state.dtdContext.enclosingStack, token],
      },
   };
}

export { conditionalStartUpdateState };
