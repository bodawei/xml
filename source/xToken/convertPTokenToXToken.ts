/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { PROCESSING_INSTRUCTION_PTOKEN, TEXTDECL_PTOKEN, XMLDECL_PTOKEN, ParseValue } from 'pToken';

import {
   CHARREF_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
} from 'token';

import { CharRefXToken } from './token/CharRefXToken';
import { GeneralEntityReferenceXToken } from './token/generalEntityReferenceXToken';
import { ParameterEntityReferenceXToken } from './token/parameterEntityReferenceXToken';
import { ProcessingInstructionXToken } from './token/processingInstructionXToken';
import { TextDeclarationXToken } from './token/textDeclarationXToken';
import { XmlDeclarationXToken } from './token/xmlDeclarationXToken';
import { XToken } from './types';

function convertPTokenToXToken(pToken: ParseValue): XToken {
   switch (pToken.type) {
      case CHARREF_PTOKEN:
         return new CharRefXToken(pToken);
      case GENERAL_ENTITY_REFERENCE_PTOKEN:
         return new GeneralEntityReferenceXToken(pToken);
      case PARAMETER_ENTITY_REFERENCE_PTOKEN:
         return new ParameterEntityReferenceXToken(pToken);
      case PROCESSING_INSTRUCTION_PTOKEN:
         return new ProcessingInstructionXToken(pToken);
      case TEXTDECL_PTOKEN:
         return new TextDeclarationXToken(pToken);
      case XMLDECL_PTOKEN:
         return new XmlDeclarationXToken(pToken);
      default:
         return pToken as any;
   }
}

export { convertPTokenToXToken };
