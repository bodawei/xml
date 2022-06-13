/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'basic';
import { ParameterEntityDeclarationPToken, PARAMETER_ENTITY_REFERENCE_PTOKEN } from 'pToken';
import { PARAMETER_ENTITY_START_PTOKEN } from 'token';

import { ValidityState } from '../common/validityState';

function parameterEntityDeclarationUpdateState(
   el: ParameterEntityDeclarationPToken,
   state: ValidityState,
): ValidityState {
   const elName = strOrBlank(el.name);
   const replacementText = el.value;
   let hasPeRefs = false;

   for (const element of replacementText) {
      hasPeRefs ||=
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
