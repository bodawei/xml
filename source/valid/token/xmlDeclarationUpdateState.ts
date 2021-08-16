/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { XmlDeclarationPToken, isXmlDeclStandalone } from 'pToken';

import { ValidityState } from '../common/validityState';

function xmlDeclarationUpdateState(el: XmlDeclarationPToken, state: ValidityState): ValidityState {
   return {
      ...state,
      isStandalone: isXmlDeclStandalone(el),
   };
}

export { xmlDeclarationUpdateState };
