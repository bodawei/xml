/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ParameterEntityDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';
import { ElidedEntityDeclarationPToken, EntityValuePToken } from 'token';

import { ValidateState } from '../validateState';

function parameterEntityDeclarationUpdateState(
   el: ParameterEntityDeclarationPToken,
   state: ValidateState,
): ValidateState {
   const elName = strOrBlank(el.name);

   if (state.parameterEntities[elName] || elName === '') {
      return state;
   }

   // Not sure this is right.
   const replacementText = new ElidedEntityDeclarationPToken(el, el.value as EntityValuePToken); // typehack

   return {
      ...state,
      parameterEntities: {
         ...state.parameterEntities,
         [elName]: {
            isInternal: !el.externalId,
            replacementText,
            token: el,
         },
      },
   };
}

export { parameterEntityDeclarationUpdateState };
