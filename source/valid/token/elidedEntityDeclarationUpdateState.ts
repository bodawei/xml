/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { ElidedEntityDeclarationPToken } from 'token';

import { ValidateState } from '../common/validateState';

function elidedEntityDeclarationUpdateState(
   el: ElidedEntityDeclarationPToken,
   state: ValidateState,
): ValidateState {
   const elName = strOrBlank(el.name);
   const existingEntry = state.parameterEntities[elName];

   // This feels iffy to me.
   if (!el.isPE || !existingEntry || existingEntry.token !== el.token) {
      return state;
   }

   return {
      ...state,
      parameterEntities: {
         ...state.parameterEntities,
         [elName]: {
            ...existingEntry,
            replacementText: el.value,
         },
      },
   };
}

export { elidedEntityDeclarationUpdateState };
