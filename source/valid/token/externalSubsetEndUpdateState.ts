/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ExternalSubsetEndToken } from 'token';

import { ValidateState } from '../common/validateState';

function externalSubsetEndUpdateState(
   el: ExternalSubsetEndToken,
   state: ValidateState,
): ValidateState {
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
