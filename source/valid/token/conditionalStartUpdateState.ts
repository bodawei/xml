/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ConditionalStartPToken } from 'token';

import { ValidityState } from '../common/validityState';

function conditionalStartUpdateState(
   token: ConditionalStartPToken,
   state: ValidityState,
): ValidityState {
   return new ValidityState(state, {
      dtdContext: {
         ...state.dtdContext,
         enclosingStack: [...state.dtdContext.enclosingStack, token],
      },
   });
}

export { conditionalStartUpdateState };
