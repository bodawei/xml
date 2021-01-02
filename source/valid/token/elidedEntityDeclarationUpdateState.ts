/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { ElidedEntityDeclarationPToken } from 'token';

import { ValidateState } from '../validateState';

function elidedEntityDeclarationUpdateState(
   el: ElidedEntityDeclarationPToken,
   state: ValidateState,
): ValidateState {
   const elName = strOrBlank(el.name);

   // This feels iffy to me.
   if (
      !el.isPE ||
      !state.parameterEntities[elName] ||
      (state.parameterEntities[elName] && state.parameterEntities[elName].token !== el.token)
   ) {
      return state;
   }

   return {
      ...state,
      parameterEntities: {
         ...state.parameterEntities,
         [elName]: {
            ...state.parameterEntities[elName],
            replacementText: el,
         },
      },
   };
}

export { elidedEntityDeclarationUpdateState };
