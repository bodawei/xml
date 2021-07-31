import {
   ErrorCollector,
   ConformanceVersion,
   CONFORMANCE_VERSION,
   ERROR_TYPE,
   ENTITY_ID,
} from 'basic';
import {
   ATTLIST_DECLARATION_PTOKEN,
   CHARREF_PTOKEN,
   ELEMENT_DECLARATION_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   NOTATION_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   ParseToken,
   PROCESSING_INSTRUCTION_PTOKEN,
   TEXTDECL_PTOKEN,
   TEXT_PTOKEN,
   XMLDECL_PTOKEN,
} from 'pToken';
import {
   CONDITIONAL_PTOKEN,
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
   CONDITIONAL_CLOSE_PTOKEN,
   UNKNOWNDECL_PTOKEN,
   GENERAL_ENTITY_END_PTOKEN,
   GENERAL_ENTITY_START_PTOKEN,
   INTERNAL_SUBSET_START_TOKEN,
   INTERNAL_SUBSET_END_TOKEN,
   getFirstSToken,
} from 'token';

import { ElDeclType, ValidateState } from './validateState';
import { attListDeclarationUpdateState } from './token/attListDeclarationUpdateState';
import { attListDeclarationValidate } from './token/attListDeclarationValidate';
import { charDataValidate } from './token/charDataValidate';
import { conditionalEndUpdateState } from './token/conditionalEndUpdateState';
import { conditionalEndValidate } from './token/conditionalEndValidate';
import { conditionalStartUpdateState } from './token/conditionalStartUpdateState';
import { conditionalStartValidate } from './token/conditionalStartValidate';
import { docEndValidate } from './token/docEndValidate';
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
import { dtdEndValidate } from './token/dtdEndValidate';
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
import { docTypeEndUpdateState } from './token/docTypeEndUpdateState';
import { docTypeStartUpdateState } from './token/docTypeStartUpdateState';
import { notationDeclarationUpdateState } from './token/notationDeclarationUpdateState';
import { notationDeclarationValidate } from './token/notationDeclarationValidate';
import { elementDeclarationPreprocess } from './token/elementDeclarationPreprocess';
import { strOrBlank } from 'sToken';
import { validityConstraint } from './error/validityConstraint';

const VID = validityConstraint.id;

// Identifies a token if it in some way represents original XML Data
function isXmlData(token: ParseToken): boolean {
   switch (token.type) {
      case ATTLIST_DECLARATION_PTOKEN:
      case CDATA_PTOKEN:
      case CHARDATA_PTOKEN:
      case CHARREF_PTOKEN:
      case COMMENT_PTOKEN:
      case CONDITIONAL_PTOKEN:
      case CONDITIONAL_CLOSE_PTOKEN:
      case DOCTYPE_END_PTOKEN:
      case DOCTYPE_START_PTOKEN:
      case ELEMENT_DECLARATION_PTOKEN:
      case ELEMENT_EMPTY_PTOKEN:
      case ELEMENT_END_PTOKEN:
      case ELEMENT_START_PTOKEN:
      case GENERAL_ENTITY_DECLARATION_PTOKEN:
      case GENERAL_ENTITY_END_PTOKEN:
      case GENERAL_ENTITY_REFERENCE_PTOKEN:
      case GENERAL_ENTITY_START_PTOKEN:
      case NOTATION_DECLARATION_PTOKEN:
      case PARAMETER_ENTITY_DECLARATION_PTOKEN:
      case PARAMETER_ENTITY_END_PTOKEN:
      case PARAMETER_ENTITY_REFERENCE_PTOKEN:
      case PARAMETER_ENTITY_START_PTOKEN:
      case PROCESSING_INSTRUCTION_PTOKEN:
      case SPACE_PTOKEN:
      case TEXT_PTOKEN:
      case TEXTDECL_PTOKEN:
      case UNKNOWNDECL_PTOKEN:
      case XMLDECL_PTOKEN:
         return true;
      default:
         return false;
   }
}

class ValidityChecker {
   private version: ConformanceVersion;

   private state: ValidateState;

   private seenXmlDecl: boolean;

   private seenVersion: boolean;

   constructor() {
      this.version = new ConformanceVersion();
      this.state = new ValidateState();
      this.seenXmlDecl = false;
      this.seenVersion = false;
   }

   checkPToken(token: ParseToken, ec: ErrorCollector): void {
      // Shouldn't THIS be creating the error collector and making sure the context is correct?
      const wasAtEndBefore = this.state.elementContext.pastEnd;
      const isXml = isXmlData(token);
      const declDetails = this.state.elementContext.activeContext?.declDetails;

      // §3.0.0 Validity Constraint: Element Valid
      //     1.0/1-2: 1. The declaration matches EMPTY and the element has no content.
      //     Other: The declaration matches EMPTY and the element has no content (not
      //        even entity references, comments, PIs or white space).
      //  [Note: we will never get here if an ElementEmpty was enccountered)
      if (declDetails?.type === ElDeclType.EMPTY) {
         ec.check(
            isXml && token.type !== ELEMENT_END_PTOKEN,
            VID.CONTENT_IN_EMPTY_ELEMENT,
            [strOrBlank(declDetails.token.name)],
            getFirstSToken(token),
         );
      }

      switch (token.type) {
         case CONFORMANCE_VERSION:
            if (!this.seenVersion) {
               this.version = token;
               this.seenVersion = true;
               this.state.confVer = token;
            }
            break;
         case ATTLIST_DECLARATION_PTOKEN:
            attListDeclarationValidate(token, this.state, ec);
            this.state = attListDeclarationUpdateState(token, this.state);
            break;
         case CHARDATA_PTOKEN:
            charDataValidate(token, this.state, ec);
            break;
         case CONDITIONAL_PTOKEN:
            conditionalStartValidate(token, this.state, ec);
            this.state = conditionalStartUpdateState(token, this.state);
            break;
         case CONDITIONAL_CLOSE_PTOKEN:
            conditionalEndValidate(token, this.state, ec);
            this.state = conditionalEndUpdateState(token, this.state);
            break;
         case DOCTYPE_START_PTOKEN:
            this.state = docTypeStartUpdateState(token, this.state);
            break;
         case DOCTYPE_END_PTOKEN:
            dtdEndValidate(this.state, ec);
            this.state = docTypeEndUpdateState(token, this.state);
            break;
         case ELEMENT_DECLARATION_PTOKEN:
            const declDetails = elementDeclarationPreprocess(token, this.state);
            elementDeclarationValidate(token, declDetails, this.state, ec, this.version);
            this.state = elementDeclarationUpdateState(token, declDetails, this.state);
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
         case CONDITIONAL_CLOSE_PTOKEN:
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
         docEndValidate(this.state, ec);
      }

      if (isXml) {
         this.state = {
            ...this.state,
            dtdContext: {
               ...this.state.dtdContext,
               lastPToken: token,
            },
         };
      }
   }
}

export { ValidityChecker };
