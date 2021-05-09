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
   GENERAL_ENTITY_END_PTOKEN,
   GENERAL_ENTITY_START_PTOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
   UNKNOWNDECL_PTOKEN,
} from 'token';

import { GeneralEntityEndXToken } from './marker/generalEntityEndXToken';
import { GeneralEntityStartXToken } from './marker/generalEntityStartXToken';
import { ParameterEntityEndXToken } from './marker/parameterEntityEndXToken';
import { ParameterEntityStartXToken } from './marker/parameterEntityStartXToken';
import { AttListDeclarationXToken } from './token/attListDeclarationXToken';
import { CharRefXToken } from './token/CharRefXToken';
import { GeneralEntityReferenceXToken } from './token/generalEntityReferenceXToken';
import { NotationDeclarationXToken } from './index';
import { ConditionalEndXToken } from './token/conditionalEndXToken';
import { ConditionalStartXToken } from './token/conditionalStartXToken';
import { CommentXToken } from './token/commentXToken';
import { DocTypeEndXToken } from './token/docTypeEndXToken';
import { DocTypeStartXToken } from './token/docTypeStartXToken';
import { ElementEmptyXToken } from './token/elementEmptyXToken';
import { ElementEndXToken } from './token/elementEndXToken';
import { ElementStartXToken } from './token/elementStartXToken';
import { ElementDeclarationXToken } from './token/elementDeclarationXToken';
import { GeneralEntityDeclarationXToken } from './token/generalEntityDeclarationXToken';
import { ParameterEntityDeclarationXToken } from './token/parameterEntityDeclarationXToken';
import { ParameterEntityReferenceXToken } from './token/parameterEntityReferenceXToken';
import { ProcessingInstructionXToken } from './token/processingInstructionXToken';
import { SpaceXToken } from './token/spaceXToken';
import { TextDeclarationXToken } from './token/textDeclarationXToken';
import { TextXToken } from './token/textXToken';
import { UnknownDeclarationXToken } from './token/unknownDeclarationXToken';
import { XmlDeclarationXToken } from './token/xmlDeclarationXToken';
import { XToken } from './types';
import { CdataXToken } from './token/cdataXToken';
import { CharDataXToken } from './token/charDataXToken';

interface ConvertOptions {
   doNothing?: string;
}

function convertPTokenToXToken(pToken: ParseToken, options?: ConvertOptions): XToken {
   if (options?.doNothing) {
   }
   switch (pToken.type) {
      case ATTLIST_DECLARATION_PTOKEN:
         return new AttListDeclarationXToken(pToken);
      case CDATA_PTOKEN:
         return new CdataXToken(pToken);
      case CHARDATA_PTOKEN:
         return new CharDataXToken(pToken);
      case CHARREF_PTOKEN:
         return new CharRefXToken(pToken);
      case COMMENT_PTOKEN:
         return new CommentXToken(pToken);
      case CONDITIONAL_PTOKEN:
         return new ConditionalStartXToken(pToken);
      case CONDITIONAL_CLOSE_PTOKEN:
         return new ConditionalEndXToken(pToken);
      case DOCTYPE_END_PTOKEN:
         return new DocTypeEndXToken(pToken);
      case DOCTYPE_START_PTOKEN:
         return new DocTypeStartXToken(pToken);
      case ELEMENT_DECLARATION_PTOKEN:
         return new ElementDeclarationXToken(pToken);
      case ELEMENT_EMPTY_PTOKEN:
         return new ElementEmptyXToken(pToken);
      case ELEMENT_END_PTOKEN:
         return new ElementEndXToken(pToken);
      case ELEMENT_START_PTOKEN:
         return new ElementStartXToken(pToken);
      case GENERAL_ENTITY_DECLARATION_PTOKEN:
         return new GeneralEntityDeclarationXToken(pToken);
      case GENERAL_ENTITY_END_PTOKEN:
         return new GeneralEntityEndXToken(pToken);
      case GENERAL_ENTITY_REFERENCE_PTOKEN:
         return new GeneralEntityReferenceXToken(pToken);
      case GENERAL_ENTITY_START_PTOKEN:
         return new GeneralEntityStartXToken(pToken);
      case NOTATION_DECLARATION_PTOKEN:
         return new NotationDeclarationXToken(pToken);
      case PARAMETER_ENTITY_DECLARATION_PTOKEN:
         return new ParameterEntityDeclarationXToken(pToken);
      case PARAMETER_ENTITY_END_PTOKEN:
         return new ParameterEntityEndXToken(pToken);
      case PARAMETER_ENTITY_START_PTOKEN:
         return new ParameterEntityStartXToken(pToken);
      case PARAMETER_ENTITY_REFERENCE_PTOKEN:
         return new ParameterEntityReferenceXToken(pToken);
      case PROCESSING_INSTRUCTION_PTOKEN:
         return new ProcessingInstructionXToken(pToken);
      case SPACE_PTOKEN:
         return new SpaceXToken(pToken);
      case TEXT_PTOKEN:
         return new TextXToken(pToken);
      case TEXTDECL_PTOKEN:
         return new TextDeclarationXToken(pToken);
      case UNKNOWNDECL_PTOKEN:
         return new UnknownDeclarationXToken(pToken);
      case XMLDECL_PTOKEN:
         return new XmlDeclarationXToken(pToken);
      default:
         return pToken;
   }
}

export { convertPTokenToXToken };
