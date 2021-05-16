/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { NotationDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { ValidateState } from '../validateState';

function notationDeclarationUpdateState(
   el: NotationDeclarationPToken,
   state: ValidateState,
): ValidateState {
   const notationName = strOrBlank(el.name);

   return {
      ...state,
      notationDeclarations: {
         ...state.notationDeclarations,
         [notationName]: true,
      },
   };
}

export { notationDeclarationUpdateState };
