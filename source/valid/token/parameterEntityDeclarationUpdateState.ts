/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ParameterEntityDeclarationPToken, PARAMETER_ENTITY_REFERENCE_PTOKEN } from 'pToken';
import { strOrBlank } from 'sToken';
import { PARAMETER_ENTITY_START_PTOKEN } from 'token';

import { ValidateState } from '../common/validateState';

function parameterEntityDeclarationUpdateState(
   el: ParameterEntityDeclarationPToken,
   state: ValidateState,
): ValidateState {
   const elName = strOrBlank(el.name);

   const replacementText = el.value;
   let hasPeRefs = false;

   for (const element of replacementText) {
      hasPeRefs =
         hasPeRefs ||
         element.type === PARAMETER_ENTITY_REFERENCE_PTOKEN ||
         element.type === PARAMETER_ENTITY_START_PTOKEN;
   }

   if (state.parameterEntities[elName] || elName === '') {
      return {
         ...state,
         hasPeRefs: state.hasPeRefs || hasPeRefs,
      };
   }

   return {
      ...state,
      hasPeRefs: state.hasPeRefs || hasPeRefs,
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
