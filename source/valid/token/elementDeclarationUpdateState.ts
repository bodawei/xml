/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ElementDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { ContentDetails, ValidityState } from '../common/validityState';

function elementDeclarationUpdateState(
   elDecl: ElementDeclarationPToken,
   details: ContentDetails,
   state: ValidityState,
): ValidityState {
   const elName = strOrBlank(elDecl.name);

   if (state.elements[elName]) {
      return state;
   }

   return new ValidityState(state, {
      elements: {
         [elName]: details,
      },
   });
}

export { elementDeclarationUpdateState };
