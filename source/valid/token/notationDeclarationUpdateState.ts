/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { NotationDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { ValidityState } from '../common/validityState';

function notationDeclarationUpdateState(
   el: NotationDeclarationPToken,
   state: ValidityState,
): ValidityState {
   const notationName = strOrBlank(el.name);

   return {
      ...state,
      notations: {
         ...state.notations,
         [notationName]: true,
      },
   };
}

export { notationDeclarationUpdateState };
