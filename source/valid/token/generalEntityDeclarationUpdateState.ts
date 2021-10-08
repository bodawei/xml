/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { GeneralEntityDeclarationPToken, PARAMETER_ENTITY_REFERENCE_PTOKEN } from 'pToken';
import { strOrBlank } from 'sToken';
import { PARAMETER_ENTITY_START_PTOKEN } from 'token';

import { ValidityState } from '../common/validityState';

function generalEntityDeclarationUpdateState(
   el: GeneralEntityDeclarationPToken,
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

   if (state.generalEntities[elName]) {
      return {
         ...state,
         hasPeRefs: state.hasPeRefs || hasPeRefs,
      };
   }

   return {
      ...state,
      generalEntities: {
         ...state.generalEntities,
         [elName]: {
            isExternalMarkupDeclaration: state.dtdContext.inExternalMarkupContext,
            isInternalValue: !el.externalId,
            token: el,
         },
      },
      hasPeRefs: state.hasPeRefs || hasPeRefs,
   };
}

export { generalEntityDeclarationUpdateState };
