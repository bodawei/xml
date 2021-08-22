/* Copyright ® 2020-2021 by 柏大衛. All rights reserved. */

import { ErrorCollector, CONFORMANCE_VERSION, ERROR_TYPE, ENTITY_ID, XmlErrorToken } from 'basic';
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
   TEXTDECL_PTOKEN,
   TEXT_PTOKEN,
   XMLDECL_PTOKEN,
   ParseToken,
} from 'pToken';
import {
   CONDITIONAL_START_PTOKEN,
   ELEMENT_START_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   ELEMENT_END_PTOKEN,
   ELIDED_ENTITY_DECLARATION_PTOKEN,
   EXTERNAL_SUBSET_START_TOKEN,
   EXTERNAL_SUBSET_END_TOKEN,
   SPACE_PTOKEN,
   CHARDATA_PTOKEN,
   DOCTYPE_START_PTOKEN,
   DOCTYPE_END_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
   CDATA_PTOKEN,
   COMMENT_PTOKEN,
   CONDITIONAL_END_PTOKEN,
   UNKNOWNDECL_PTOKEN,
   GENERAL_ENTITY_END_PTOKEN,
   GENERAL_ENTITY_START_PTOKEN,
   INTERNAL_SUBSET_START_TOKEN,
   INTERNAL_SUBSET_END_TOKEN,
   getFirstSToken,
} from 'token';

import { contentUpdateState } from './common/contentUpdateState';
import { contentValidate } from './common/contentValidate';
import { entityDeclarationValueValidate } from './common/entityDeclarationValueValidate';
import { isXmlData } from './common/isXmlData';
import { ValidityState } from './common/validityState';
import { attListDeclarationUpdateState } from './token/attListDeclarationUpdateState';
import { attListDeclarationValidate } from './token/attListDeclarationValidate';
import { charDataValidate } from './token/charDataValidate';
import { conditionalEndUpdateState } from './token/conditionalEndUpdateState';
import { conditionalEndValidate } from './token/conditionalEndValidate';
import { conditionalStartUpdateState } from './token/conditionalStartUpdateState';
import { conditionalStartValidate } from './token/conditionalStartValidate';
import { contentEndValidate } from './token/contentEndValidate';
import { docTypeEndUpdateState } from './token/docTypeEndUpdateState';
import { docTypeEndValidate } from './token/docTypeEndValidate';
import { docTypeStartUpdateState } from './token/docTypeStartUpdateState';
import { elementDeclarationUpdateState } from './token/elementDeclarationUpdateState';
import { elementDeclarationValidate } from './token/elementDeclarationValidate';
import { elementStartUpdateState } from './token/elementStartUpdateState';
import { elementStartValidate } from './token/elementStartValidate';
import { elidedEntityDeclarationUpdateState } from './token/elidedEntityDeclarationUpdateState';
import { entityDeclarationValidate } from './token/entityDeclarationValidate';
import { externalSubsetEndUpdateState } from './token/externalSubsetEndUpdateState';
import { externalSubsetStartUpdateState } from './token/externalSubsetStartUpdateState';
import { elementEndUpdateState } from './token/elementEndUpdateState';
import { elementEndValidate } from './token/elementEndValidate';
import { generalEntityDeclarationUpdateState } from './token/generalEntityDeclarationUpdateState';
import { generalEntityReferenceValidate } from './token/generalEntityReferenceValidate';
import { generalEntityStartValidate } from './token/generalEntityStartValidate';
import { parameterEntityDeclarationUpdateState } from './token/parameterEntityDeclarationUpdateState';
import { parameterEntityEndUpdateState } from './token/parameterEntityEndUpdateState';
import { parameterEntityEndValidate } from './token/parameterEntityEndValidate';
import { parameterEntityReferenceValidate } from './token/parameterEntityReferenceValidate';
import { parameterEntityStartUpdateState } from './token/parameterEntityStartUpdateState';
import { parameterEntityStartValidate } from './token/parameterEntityStartValidate';
import { spaceValidate } from './token/spaceValidate';
import { xmlDeclarationUpdateState } from './token/xmlDeclarationUpdateState';
import { notationDeclarationUpdateState } from './token/notationDeclarationUpdateState';
import { notationDeclarationValidate } from './token/notationDeclarationValidate';
import { elementDeclarationPreprocess } from './common/elementDeclarationPreprocess';
import { ValidityError } from './error/validityError';

class ValidityChecker {
   private state: ValidityState;

   private seenXmlDecl: boolean;

   private seenVersion: boolean;

   constructor() {
      this.state = new ValidityState();
      this.seenXmlDecl = false;
      this.seenVersion = false;
   }

   check(token: ParseToken): Array<XmlErrorToken> {
      const ec = new ErrorCollector(getFirstSToken(token), ValidityError);
      const wasAtEndBefore = this.state.elementContext.pastEnd;

      contentValidate(token, this.state, ec);
      this.state = contentUpdateState(token, this.state);

      switch (token.type) {
         case CONFORMANCE_VERSION:
            if (!this.seenVersion) {
               this.seenVersion = true;
               this.state = new ValidityState(this.state, {
                  confVer: token,
               });
            }
            break;
         case ATTLIST_DECLARATION_PTOKEN:
            attListDeclarationValidate(token, this.state, ec);
            this.state = attListDeclarationUpdateState(token, this.state);
            break;
         case CHARDATA_PTOKEN:
            charDataValidate(token, this.state, ec);
            break;
         case CONDITIONAL_START_PTOKEN:
            conditionalStartValidate(token, this.state, ec);
            this.state = conditionalStartUpdateState(token, this.state);
            break;
         case CONDITIONAL_END_PTOKEN:
            conditionalEndValidate(token, this.state, ec);
            this.state = conditionalEndUpdateState(token, this.state);
            break;
         case DOCTYPE_START_PTOKEN:
            this.state = docTypeStartUpdateState(token, this.state);
            break;
         case DOCTYPE_END_PTOKEN:
            docTypeEndValidate(this.state, ec);
            this.state = docTypeEndUpdateState(token, this.state);
            break;
         case ELEMENT_DECLARATION_PTOKEN:
            const details = elementDeclarationPreprocess(token, this.state);
            elementDeclarationValidate(token, details, this.state, ec);
            this.state = elementDeclarationUpdateState(token, details, this.state);
            break;
         case ELEMENT_END_PTOKEN:
            elementEndValidate(token, this.state, ec);
            this.state = elementEndUpdateState(token, this.state);
            break;
         case ELEMENT_START_PTOKEN:
         case ELEMENT_EMPTY_PTOKEN:
            elementStartValidate(token, this.state, ec);
            this.state = elementStartUpdateState(token, this.state);
            break;
         case ELIDED_ENTITY_DECLARATION_PTOKEN:
            entityDeclarationValueValidate(token, this.state, ec);
            this.state = elidedEntityDeclarationUpdateState(token, this.state);
            break;
         case EXTERNAL_SUBSET_END_TOKEN:
            this.state = externalSubsetEndUpdateState(token, this.state);
            break;
         case EXTERNAL_SUBSET_START_TOKEN:
            this.state = externalSubsetStartUpdateState(token, this.state);
            break;
         case GENERAL_ENTITY_DECLARATION_PTOKEN:
            entityDeclarationValidate(token, this.state, ec);
            this.state = generalEntityDeclarationUpdateState(token, this.state);
            break;
         case GENERAL_ENTITY_REFERENCE_PTOKEN:
            generalEntityReferenceValidate(token, this.state, ec);
            break;
         case GENERAL_ENTITY_START_PTOKEN:
            generalEntityStartValidate(token, this.state, ec);
            break;
         case NOTATION_DECLARATION_PTOKEN:
            notationDeclarationValidate(token, this.state, ec);
            this.state = notationDeclarationUpdateState(token, this.state);
            break;
         case PARAMETER_ENTITY_DECLARATION_PTOKEN:
            entityDeclarationValidate(token, this.state, ec);
            this.state = parameterEntityDeclarationUpdateState(token, this.state);
            break;
         case PARAMETER_ENTITY_END_PTOKEN:
            parameterEntityEndValidate(token, this.state, ec);
            this.state = parameterEntityEndUpdateState(token, this.state);
            break;
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            parameterEntityReferenceValidate(token, this.state, ec);
            break;
         case PARAMETER_ENTITY_START_PTOKEN:
            parameterEntityStartValidate(token, this.state, ec);
            this.state = parameterEntityStartUpdateState(token, this.state);
            break;
         case SPACE_PTOKEN:
            spaceValidate(token, this.state, ec);
            break;
         case XMLDECL_PTOKEN:
            if (!this.seenXmlDecl) {
               this.state = xmlDeclarationUpdateState(token, this.state);
               this.seenXmlDecl = true;
            }
            break;
         case CDATA_PTOKEN:
         case COMMENT_PTOKEN:
         case CONDITIONAL_END_PTOKEN:
         case UNKNOWNDECL_PTOKEN:
         case CHARREF_PTOKEN:
         case PROCESSING_INSTRUCTION_PTOKEN:
         case TEXTDECL_PTOKEN:
         case TEXT_PTOKEN:
         case ERROR_TYPE:
         case ENTITY_ID:
         case GENERAL_ENTITY_END_PTOKEN:
         case GENERAL_ENTITY_START_PTOKEN:
         case INTERNAL_SUBSET_START_TOKEN:
         case INTERNAL_SUBSET_END_TOKEN:
         default:
            break;
      }

      if (!wasAtEndBefore && this.state.elementContext.pastEnd) {
         contentEndValidate(this.state, ec);
      }

      if (isXmlData(token)) {
         this.state = new ValidityState(this.state, {
            dtdContext: {
               ...this.state.dtdContext,
               lastPToken: token,
            },
         });
      }

      return ec.getErrors();
   }
}

export { ValidityChecker };
