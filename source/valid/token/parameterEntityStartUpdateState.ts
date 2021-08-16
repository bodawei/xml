/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ParameterEntityStartPToken } from 'token';

import { ValidityState } from '../common/validityState';

function parameterEntityStartUpdateState(
   startPToken: ParameterEntityStartPToken,
   state: ValidityState,
): ValidityState {
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
