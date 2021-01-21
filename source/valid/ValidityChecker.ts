import { ErrorCollector, ConformanceVersion, CONFORMANCE_VERSION } from 'basic';
import {
   ATTLIST_DECLARATION_PTOKEN,
   ELEMENT_DECLARATION_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   ParseToken,
   XMLDECL_PTOKEN,
} from 'pToken';

import { ValidateState } from './validateState';
import { attListDeclarationUpdateState } from './token/attListDeclarationUpdateState';
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
import { generalEntityReferenceValidate } from './token/generalEntityReferenceValidate';
import { parameterEntityReferenceValidate } from './token/parameterEntityReferenceValidate';
import { parameterEntityDeclarationUpdateState } from './token/parameterEntityDeclarationUpdateState';
import { xmlDeclarationUpdateState } from './token/xmlDeclarationUpdateState';

// ick
import {
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   ELEMENT_START_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   ELEMENT_END_PTOKEN,
   ELIDED_ENTITY_DECLARATION_PTOKEN,
   EXTERNAL_SUBSET_START_TOKEN,
   EXTERNAL_SUBSET_END_TOKEN,
} from 'token';

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
            }
            break;
         case ATTLIST_DECLARATION_PTOKEN:
            this.state = attListDeclarationUpdateState(token, this.state);
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
         case PARAMETER_ENTITY_DECLARATION_PTOKEN:
            this.state = parameterEntityDeclarationUpdateState(token, this.state);
            break;
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            parameterEntityReferenceValidate(token, this.state, ec);
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
