/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { GeneralEntityDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { ValidateState } from '../validateState';

function generalEntityDeclarationUpdateState(
   el: GeneralEntityDeclarationPToken,
   state: ValidateState,
): ValidateState {
   const elName = strOrBlank(el.name);

   if (state.generalEntities[elName]) {
      return state;
   }

   return {
      ...state,
      generalEntities: {
         ...state.generalEntities,
         [elName]: {
            isInternal: !el.externalId,
         },
      },
   };
}

export { generalEntityDeclarationUpdateState };
