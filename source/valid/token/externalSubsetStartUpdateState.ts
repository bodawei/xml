/* Copyright ® 2020-2021 by 柏大衛. All rights reserved. */

import { ExternalSubsetStartToken } from 'token';

import { ValidityState } from '../common/validityState';

function externalSubsetStartUpdateState(
   el: ExternalSubsetStartToken,
   state: ValidityState,
): ValidityState {
   return {
      ...state,
      dtdContext: {
         ...state.dtdContext,
         inExternalMarkupContext: true,
         inExternalSubset: true,
      },
   };
}

export { externalSubsetStartUpdateState };
