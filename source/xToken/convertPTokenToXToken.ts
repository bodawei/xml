/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { PToken, XMLDECL_PTOKEN, TEXTDECL_PTOKEN } from 'token';

import { XmlDeclarationXToken } from './token/xmlDeclarationXToken';
import { TextDeclarationXToken } from './token/textDeclarationXToken';
import { XToken } from './types';

function convertPTokenToXToken(pToken: PToken): XToken {
   switch (pToken.type) {
      case TEXTDECL_PTOKEN:
         return new TextDeclarationXToken(pToken);
      case XMLDECL_PTOKEN:
         return new XmlDeclarationXToken(pToken);
      default:
         return pToken as any;
   }
}

export { convertPTokenToXToken };
