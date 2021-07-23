/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ParameterEntityDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { ValidateState } from '../validateState';

function parameterEntityDeclarationUpdateState(
   el: ParameterEntityDeclarationPToken,
   state: ValidateState,
): ValidateState {
   const elName = strOrBlank(el.name);

   if (state.parameterEntities[elName] || elName === '') {
      return state;
   }

   const replacementText = el.value;

   return {
      ...state,
      parameterEntities: {
         ...state.parameterEntities,
         [elName]: {
            isExternalMarkupDeclaration: state.dtdContext.inExternalMarkupContext,
            isInternalValue: !el.externalId,
            replacementText,
            token: el,
         },
      },
   };
}

export { parameterEntityDeclarationUpdateState };
