import { ErrorCollector, ConformanceVersion, CONFORMANCE_VERSION } from 'basic';
import {
   ATTLIST_DECLARATION_PTOKEN,
   ELEMENT_DECLARATION_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   NOTATION_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   ParseToken,
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
} from 'token';

import { ValidateState } from './validateState';
import { attListDeclarationUpdateState } from './token/attListDeclarationUpdateState';
import { charDataValidate } from './token/charDataValidate';
import { conditionalValidate } from './token/conditionalValidate';
import { elementDeclarationUpdateState } from './token/elementDeclarationUpdateState';
import { elementDeclarationValidate } from './token/elementDeclarationValidate';
import { elementStartUpdateState } from './token/elementStartUpdateState';
import { elementStartValidate } from './token/elementStartValidate';
import { elidedEntityDeclarationUpdateState } from './token/elidedEntityDeclarationUpdateState';
import { externalSubsetEndUpdateState } from './token/externalSubsetEndUpdateState';
import { externalSubsetStartUpdateState } from './token/externalSubsetStartUpdateState';
import { elementEndUpdateState } from './token/elementEndUpdateState';
import { elementEndValidate } from './token/elementEndValidate';
import { generalEntityDeclarationUpdateState } from './token/generalEntityDeclarationUpdateState';
import { dtdEndValidate } from './token/dtdEndValidate';
import { generalEntityReferenceValidate } from './token/generalEntityReferenceValidate';
import { parameterEntityReferenceValidate } from './token/parameterEntityReferenceValidate';
import { parameterEntityDeclarationUpdateState } from './token/parameterEntityDeclarationUpdateState';
import { spaceValidate } from './token/spaceValidate';
import { xmlDeclarationUpdateState } from './token/xmlDeclarationUpdateState';
import { docTypeStartUpdateState } from './token/docTypeStartUpdateState';
import { notationDeclarationUpdateState } from './token/notationDeclarationUpdateState';
import { notationDeclarationValidate } from './token/notationDeclarationValidate';

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
      switch (token.type) {
         case CONFORMANCE_VERSION:
            if (!this.seenVersion) {
               this.version = token;
               this.seenVersion = true;
               this.state.confVer = token;
            }
            break;
         case ATTLIST_DECLARATION_PTOKEN:
            this.state = attListDeclarationUpdateState(token, this.state);
            break;
         case CHARDATA_PTOKEN:
            charDataValidate(token, this.state, ec);
            break;
         case CONDITIONAL_PTOKEN:
            conditionalValidate(token, this.state, ec);
            break;
         case DOCTYPE_START_PTOKEN:
            this.state = docTypeStartUpdateState(token, this.state);
            break;
         case DOCTYPE_END_PTOKEN:
            dtdEndValidate(this.state, ec);
            break;
         case ELEMENT_DECLARATION_PTOKEN:
            this.state = elementDeclarationUpdateState(token, this.state);
            elementDeclarationValidate(token, this.state, ec, this.version);
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
            this.state = generalEntityDeclarationUpdateState(token, this.state);
            break;
         case GENERAL_ENTITY_REFERENCE_PTOKEN:
            generalEntityReferenceValidate(token, this.state, ec);
            break;
         case NOTATION_DECLARATION_PTOKEN:
            notationDeclarationValidate(token, this.state, ec);
            this.state = notationDeclarationUpdateState(token, this.state);
            break;
         case PARAMETER_ENTITY_DECLARATION_PTOKEN:
            this.state = parameterEntityDeclarationUpdateState(token, this.state);
            break;
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            parameterEntityReferenceValidate(token, this.state, ec);
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
         default:
            break;
      }
   }
}

export { ValidityChecker };
