/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ParameterEntityStartPToken } from 'token';

import { ValidateState } from '../validateState';

function parameterEntityStartUpdateState(
   startPToken: ParameterEntityStartPToken,
   state: ValidateState,
): ValidateState {
   return {
      ...state,
      dtdContext: {
         ...state.dtdContext,
         enclosingStack: [...state.dtdContext.enclosingStack, startPToken],
      },
   };
}

export { parameterEntityStartUpdateState };
