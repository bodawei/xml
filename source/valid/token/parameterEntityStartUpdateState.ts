/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ParameterEntityStartPToken } from 'token';

import { ValidateState } from '../common/validateState';

function parameterEntityStartUpdateState(
   startPToken: ParameterEntityStartPToken,
   state: ValidateState,
): ValidateState {
   return {
      ...state,
      dtdContext: {
         ...state.dtdContext,
         enclosingStack: [...state.dtdContext.enclosingStack, startPToken],
         inExternalMarkupContext: true,
      },
      hasPeRefs: true,
   };
}

export { parameterEntityStartUpdateState };
