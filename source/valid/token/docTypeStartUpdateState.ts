/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { DocTypeStartPToken } from 'token';

import { ValidateState } from '../validateState';

function docTypeStartUpdateState(
   docTypePToken: DocTypeStartPToken,
   state: ValidateState,
): ValidateState {
   const docTypeName = strOrBlank(docTypePToken.name);

   return {
      ...state,
      docType: docTypeName,
   };
}

export { docTypeStartUpdateState };
