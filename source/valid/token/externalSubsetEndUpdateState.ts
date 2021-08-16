/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ExternalSubsetEndToken } from 'token';

import { ValidityState } from '../common/validityState';

function externalSubsetEndUpdateState(
   el: ExternalSubsetEndToken,
   state: ValidityState,
): ValidityState {
   return {
      ...state,
      dtdContext: {
         ...state.dtdContext,
         inExternalMarkupContext: false,
         inExternalSubset: false,
      },
   };
}

export { externalSubsetEndUpdateState };
