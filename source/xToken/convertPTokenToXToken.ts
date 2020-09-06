/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { XMLDECL_PTOKEN, ParseValue } from 'pToken';

import {
   TEXTDECL_PTOKEN,
   CHARREF_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
} from 'token';

import { CharRefXToken } from './token/CharRefXToken';
import { ParameterEntityReferenceXToken } from './token/parameterEntityReferenceXToken';
import { TextDeclarationXToken } from './token/textDeclarationXToken';
import { XmlDeclarationXToken } from './token/xmlDeclarationXToken';
import { XToken } from './types';
import { GeneralEntityReferenceXToken } from './token/generalEntityReferenceXToken';

function convertPTokenToXToken(pToken: ParseValue): XToken {
   switch (pToken.type) {
      case CHARREF_PTOKEN:
         return new CharRefXToken(pToken);
      case GENERAL_ENTITY_REFERENCE_PTOKEN:
         return new GeneralEntityReferenceXToken(pToken);
      case PARAMETER_ENTITY_REFERENCE_PTOKEN:
         return new ParameterEntityReferenceXToken(pToken);
      case TEXTDECL_PTOKEN:
         return new TextDeclarationXToken(pToken);
      case XMLDECL_PTOKEN:
         return new XmlDeclarationXToken(pToken);
      default:
         return pToken as any;
   }
}

export { convertPTokenToXToken };
