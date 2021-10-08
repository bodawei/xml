/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { ElidedEntityDeclarationPToken } from 'token';

import { ValidityState } from '../common/validityState';

function elidedEntityDeclarationUpdateState(
   el: ElidedEntityDeclarationPToken,
   state: ValidityState,
): ValidityState {
   const elName = strOrBlank(el.name);
   const existingEntry = state.parameterEntities[elName];

   if (!el.isPE || !existingEntry || existingEntry.token !== el.token) {
      return state;
   }

   return new ValidityState(state, {
      parameterEntities: {
         [elName]: {
            ...existingEntry,
            replacementText: el.value,
         },
      },
   });
}

export { elidedEntityDeclarationUpdateState };
