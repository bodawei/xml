/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { DocTypeStartPToken } from 'token';

import { ValidateState } from '../common/validateState';

function docTypeStartUpdateState(
   docTypePToken: DocTypeStartPToken,
   state: ValidateState,
): ValidateState {
   const docTypeName = strOrBlank(docTypePToken.name);

   return {
      ...state,
      docType: docTypeName,
      dtdContext: {
         ...state.dtdContext,
         enclosingStack: [...state.dtdContext.enclosingStack, docTypePToken],
      },
      hasExternalSubset: !!docTypePToken.externalId,
   };
}

export { docTypeStartUpdateState };
