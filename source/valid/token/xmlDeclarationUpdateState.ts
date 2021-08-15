/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { XmlDeclarationPToken, isXmlDeclStandalone } from 'pToken';

import { ValidateState } from '../common/validateState';

function xmlDeclarationUpdateState(el: XmlDeclarationPToken, state: ValidateState): ValidateState {
   return {
      ...state,
      isStandalone: isXmlDeclStandalone(el),
   };
}

export { xmlDeclarationUpdateState };
