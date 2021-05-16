/* Copyright ® 2021 by 柏大衛. All rights reserved. */

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
import { SToken } from 'sToken';
import {
   CDATA_PTOKEN,
   CHARDATA_PTOKEN,
   COMMENT_PTOKEN,
   CONDITIONAL_CLOSE_PTOKEN,
   CONDITIONAL_PTOKEN,
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   ELEMENT_END_PTOKEN,
   ELEMENT_START_PTOKEN,
   SPACE_PTOKEN,
   UNKNOWNDECL_PTOKEN,
} from 'token';

import { attListDeclarationToSTokens } from './token/attListDeclarationToSTokens';
import { charRefToSTokens } from './token/charRefToSTokens';
import { generalEntityReferenceToSTokens } from './token/generalEntityReferenceToSTokens';
import { notationDeclarationToSTokens } from './token/notationDeclarationToSTokens';
import { conditionalEndToSTokens } from './token/conditionalEndToSTokens';
import { conditionalStartToSTokens } from './token/conditionalStartToSTokens';
import { commentToSTokens } from './token/commentToSTokens';
import { docTypeEndToSTokens } from './token/docTypeEndToSTokens';
import { docTypeStartToSTokens } from './token/docTypeStartToSTokens';
import { elementEndToSTokens } from './token/elementEndToSTokens';
import { elementStartToSTokens } from './token/elementStartToSTokens';
import { elementDeclarationToSTokens } from './token/elementDeclarationToSTokens';
import { generalEntityDeclarationToSTokens } from './token/generalEntityDeclarationToSTokens';
import { parameterEntityDeclarationToSTokens } from './token/parameterEntityDeclarationToSTokens';
import { parameterEntityReferenceToSTokens } from './token/parameterEntityReferenceToSTokens';
import { processingInstructionToSTokens } from './token/processingInstructionToSTokens';
import { spaceToSTokens } from './token/spaceToSTokens';
import { textDeclarationToSTokens } from './token/textDeclarationToSTokens';
import { textToSTokens } from './token/textToSTokens';
import { unknownDeclarationToSTokens } from './token/unknownDeclarationToSTokens';
import { xmlDeclarationToSTokens } from './token/xmlDeclarationToSTokens';
import { cdataToSTokens } from './token/cdataToSTokens';
import { charDataToSTokens } from './token/charDataToSTokens';

function convertPTokenToSTokens(pToken: ParseToken): Array<SToken> {
   switch (pToken.type) {
      case ATTLIST_DECLARATION_PTOKEN:
         return attListDeclarationToSTokens(pToken);
      case CDATA_PTOKEN:
         return cdataToSTokens(pToken);
      case CHARDATA_PTOKEN:
         return charDataToSTokens(pToken);
      case CHARREF_PTOKEN:
         return charRefToSTokens(pToken);
      case COMMENT_PTOKEN:
         return commentToSTokens(pToken);
      case CONDITIONAL_PTOKEN:
         return conditionalStartToSTokens(pToken);
      case CONDITIONAL_CLOSE_PTOKEN:
         return conditionalEndToSTokens(pToken);
      case DOCTYPE_END_PTOKEN:
         return docTypeEndToSTokens(pToken);
      case DOCTYPE_START_PTOKEN:
         return docTypeStartToSTokens(pToken);
      case ELEMENT_DECLARATION_PTOKEN:
         return elementDeclarationToSTokens(pToken);
      case ELEMENT_END_PTOKEN:
         return elementEndToSTokens(pToken);
      case ELEMENT_EMPTY_PTOKEN:
      case ELEMENT_START_PTOKEN:
         return elementStartToSTokens(pToken);
      case GENERAL_ENTITY_DECLARATION_PTOKEN:
         return generalEntityDeclarationToSTokens(pToken);
      case GENERAL_ENTITY_REFERENCE_PTOKEN:
         return generalEntityReferenceToSTokens(pToken);
      case NOTATION_DECLARATION_PTOKEN:
         return notationDeclarationToSTokens(pToken);
      case PARAMETER_ENTITY_DECLARATION_PTOKEN:
         return parameterEntityDeclarationToSTokens(pToken);
      case PARAMETER_ENTITY_REFERENCE_PTOKEN:
         return parameterEntityReferenceToSTokens(pToken);
      case PROCESSING_INSTRUCTION_PTOKEN:
         return processingInstructionToSTokens(pToken);
      case SPACE_PTOKEN:
         return spaceToSTokens(pToken);
      case TEXT_PTOKEN:
         return textToSTokens(pToken);
      case TEXTDECL_PTOKEN:
         return textDeclarationToSTokens(pToken);
      case UNKNOWNDECL_PTOKEN:
         return unknownDeclarationToSTokens(pToken);
      case XMLDECL_PTOKEN:
         return xmlDeclarationToSTokens(pToken);
      // Ignore these. If they exist, then we don't care about the original reference.  And if we do care about the original reference, these won't exist
      // case GENERAL_ENTITY_END_PTOKEN:
      // case GENERAL_ENTITY_START_PTOKEN:
      // case PARAMETER_ENTITY_END_PTOKEN:
      // case PARAMETER_ENTITY_START_PTOKEN:
      default:
         return [];
   }
}

export { convertPTokenToSTokens };
