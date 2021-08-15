/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ExternalSubsetStartToken } from 'token';

import { ValidateState } from '../common/validateState';

function externalSubsetStartUpdateState(
   el: ExternalSubsetStartToken,
   state: ValidateState,
): ValidateState {
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
