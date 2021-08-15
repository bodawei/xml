/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ElementDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { DeclarationDetails, ValidateState } from '../common/validateState';

function elementDeclarationUpdateState(
   elDecl: ElementDeclarationPToken,
   declDetails: DeclarationDetails,
   state: ValidateState,
): ValidateState {
   const elName = strOrBlank(elDecl.name);

   if (state.elementDeclarations[elName]) {
      return state;
   }

   state.elementDeclarations[elName] = declDetails;

   return state;
}

export { elementDeclarationUpdateState };
