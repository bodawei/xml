/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import {
   PROCESSING_INSTRUCTION_PTOKEN,
   TEXTDECL_PTOKEN,
   XMLDECL_PTOKEN,
   ParseValue,
   ATTLIST_DECLARATION_PTOKEN,
} from 'pToken';
// ick
import { NOTATION_DECLARATION_PTOKEN } from '../pToken/token/notationDeclaration';

import {
   CHARREF_PTOKEN,
   CONDITIONAL_CLOSE_PTOKEN,
   CONDITIONAL_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
} from 'token';

import { AttListDeclarationXToken } from './token/attListDeclarationXToken';
import { CharRefXToken } from './token/CharRefXToken';
import { GeneralEntityReferenceXToken } from './token/generalEntityReferenceXToken';
// tsnode seems to load this file twice. here and in the index.  So, here we only load it once.  Unclear why it is doing this, though.
import { NotationDeclarationXToken } from './index';
import { ConditionalSectionEndXToken } from './token/conditionalSectionEndXToken';
import { ConditionalSectionStartXToken } from './token/conditionalSectionStartXToken';
import { ParameterEntityReferenceXToken } from './token/parameterEntityReferenceXToken';
import { ProcessingInstructionXToken } from './token/processingInstructionXToken';
import { TextDeclarationXToken } from './token/textDeclarationXToken';
import { XmlDeclarationXToken } from './token/xmlDeclarationXToken';
import { XToken } from './types';

function convertPTokenToXToken(pToken: ParseValue): XToken {
   switch (pToken.type) {
      case ATTLIST_DECLARATION_PTOKEN:
         return new AttListDeclarationXToken(pToken);
      case CONDITIONAL_PTOKEN:
         return new ConditionalSectionStartXToken(pToken);
      case CONDITIONAL_CLOSE_PTOKEN:
         return new ConditionalSectionEndXToken(pToken);
      case CHARREF_PTOKEN:
         return new CharRefXToken(pToken);
      case GENERAL_ENTITY_REFERENCE_PTOKEN:
         return new GeneralEntityReferenceXToken(pToken);
      case NOTATION_DECLARATION_PTOKEN:
         return new NotationDeclarationXToken(pToken);
      case PARAMETER_ENTITY_REFERENCE_PTOKEN:
         return new ParameterEntityReferenceXToken(pToken);
      case PROCESSING_INSTRUCTION_PTOKEN:
         return new ProcessingInstructionXToken(pToken);
      case TEXTDECL_PTOKEN:
         return new TextDeclarationXToken(pToken);
      case XMLDECL_PTOKEN:
         return new XmlDeclarationXToken(pToken);
      default:
         return pToken;
   }
}

export { convertPTokenToXToken };
