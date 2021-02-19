/* Copyright ® 2020-2021 by 柏大衛. All rights reserved. */

import {
   ATTLIST_DECLARATION_PTOKEN,
   CHARREF_PTOKEN,
   ELEMENT_DECLARATION_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   NOTATION_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   PROCESSING_INSTRUCTION_PTOKEN,
   TEXT_PTOKEN,
   TEXTDECL_PTOKEN,
   XMLDECL_PTOKEN,
   ParseToken,
} from 'pToken';

import { CONDITIONAL_CLOSE_PTOKEN, CONDITIONAL_PTOKEN } from 'token';

import { AttListDeclarationXToken } from './token/attListDeclarationXToken';
import { CharRefXToken } from './token/CharRefXToken';
import { GeneralEntityReferenceXToken } from './token/generalEntityReferenceXToken';
// tsnode seems to load this file twice. here and in the index.  So, here we only load it once.  Unclear why it is doing this, though.
import { NotationDeclarationXToken } from './index';
import { ConditionalSectionEndXToken } from './token/conditionalSectionEndXToken';
import { ConditionalSectionStartXToken } from './token/conditionalSectionStartXToken';
import { ElementDeclarationXToken } from './token/elementDeclarationXToken';
import { GeneralEntityDeclarationXToken } from './token/generalEntityDeclarationXToken';
import { ParameterEntityDeclarationXToken } from './token/parameterEntityDeclarationXToken';
import { ParameterEntityReferenceXToken } from './token/parameterEntityReferenceXToken';
import { ProcessingInstructionXToken } from './token/processingInstructionXToken';
import { TextDeclarationXToken } from './token/textDeclarationXToken';
import { TextXToken } from './token/textXToken';
import { XmlDeclarationXToken } from './token/xmlDeclarationXToken';
import { XToken } from './types';

function convertPTokenToXToken(pToken: ParseToken): XToken {
   switch (pToken.type) {
      case ATTLIST_DECLARATION_PTOKEN:
         return new AttListDeclarationXToken(pToken);
      case CONDITIONAL_PTOKEN:
         return new ConditionalSectionStartXToken(pToken);
      case CONDITIONAL_CLOSE_PTOKEN:
         return new ConditionalSectionEndXToken(pToken);
      case CHARREF_PTOKEN:
         return new CharRefXToken(pToken);
      case ELEMENT_DECLARATION_PTOKEN:
         return new ElementDeclarationXToken(pToken);
      case GENERAL_ENTITY_DECLARATION_PTOKEN:
         return new GeneralEntityDeclarationXToken(pToken);
      case GENERAL_ENTITY_REFERENCE_PTOKEN:
         return new GeneralEntityReferenceXToken(pToken);
      case NOTATION_DECLARATION_PTOKEN:
         return new NotationDeclarationXToken(pToken);
      case PARAMETER_ENTITY_DECLARATION_PTOKEN:
         return new ParameterEntityDeclarationXToken(pToken);
      case PARAMETER_ENTITY_REFERENCE_PTOKEN:
         return new ParameterEntityReferenceXToken(pToken);
      case PROCESSING_INSTRUCTION_PTOKEN:
         return new ProcessingInstructionXToken(pToken);
      case TEXT_PTOKEN:
         return new TextXToken(pToken);
      case TEXTDECL_PTOKEN:
         return new TextDeclarationXToken(pToken);
      case XMLDECL_PTOKEN:
         return new XmlDeclarationXToken(pToken);
      default:
         return pToken;
   }
}

export { convertPTokenToXToken };
