/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';

import { ENTITY_META_DATA } from 'basic';
import { WellFormedError } from 'error';
import {
   declaration,

   attListDeclaration,
   elementDeclaration,

   CDATA_PTOKEN,
   CHARDATA_PTOKEN,
   CHARREF_PTOKEN,
   COMMENT_PTOKEN,
   CONDITIONAL_PTOKEN,
   CONDITIONAL_CLOSE_PTOKEN,
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   ELEMENT_END_PTOKEN,
   ELEMENT_START_PTOKEN,
   EXTERNAL_SUBSET_START_TOKEN,
   EXTERNAL_SUBSET_END_TOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GENERAL_ENTITY_START_PTOKEN,
   GENERAL_ENTITY_END_PTOKEN,
   INTERNAL_SUBSET_END_TOKEN,
   INTERNAL_SUBSET_START_TOKEN,
   NOTATION_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
   PROCESSING_INSTRUCTION_PTOKEN,
   SPACE_PTOKEN,
   TEXT_PTOKEN,
   TEXTDECL_PTOKEN,
   XMLDECL_PTOKEN,
} from 'token';

import { convertPTokenToXToken, conditionalClosePTokenToXToken, conditionalSectionPTokenToXToken } from 'xToken';

class PToXTokenStream extends Transform {

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(pToken: any, _: string, done: () => void) { // typeHack
      switch (pToken.type) {
         case declaration.PTYPE:
            this.push(declaration.pTokenToXToken(pToken));
            break;
         case attListDeclaration.PTYPE:
            this.push(attListDeclaration.pTokenToXToken(pToken));
            break;
         case elementDeclaration.PTYPE:
            this.push(elementDeclaration.pTokenToXToken(pToken));
            break;
         case CONDITIONAL_PTOKEN:
            this.push(conditionalSectionPTokenToXToken(pToken));
            break;
         case CONDITIONAL_CLOSE_PTOKEN:
            this.push(conditionalClosePTokenToXToken(pToken));
            break;
         case CDATA_PTOKEN:
         case CHARDATA_PTOKEN:
         case COMMENT_PTOKEN:
         case DOCTYPE_END_PTOKEN:
         case DOCTYPE_START_PTOKEN:
         case ELEMENT_EMPTY_PTOKEN:
         case ELEMENT_END_PTOKEN:
         case ELEMENT_START_PTOKEN:
         case GENERAL_ENTITY_DECLARATION_PTOKEN:
         case GENERAL_ENTITY_START_PTOKEN:
         case GENERAL_ENTITY_END_PTOKEN:
         case NOTATION_DECLARATION_PTOKEN:
         case PARAMETER_ENTITY_DECLARATION_PTOKEN:
         case PARAMETER_ENTITY_END_PTOKEN:
         case PARAMETER_ENTITY_START_PTOKEN:
         case PROCESSING_INSTRUCTION_PTOKEN:
         case SPACE_PTOKEN:
         case TEXT_PTOKEN:
            this.push(pToken.toXToken());
                           break;
         case CHARREF_PTOKEN:
         case GENERAL_ENTITY_REFERENCE_PTOKEN:
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
         case TEXTDECL_PTOKEN:
         case XMLDECL_PTOKEN:
            this.push(convertPTokenToXToken(pToken));
            break;
         case INTERNAL_SUBSET_START_TOKEN:
         case INTERNAL_SUBSET_END_TOKEN:
         case EXTERNAL_SUBSET_START_TOKEN:
         case EXTERNAL_SUBSET_END_TOKEN:
         case ENTITY_META_DATA:
         case 'ERROR_TYPE':
            this.push(pToken);
            break;
         default:
            this.push(new WellFormedError(WellFormedError.ID.INTERNAL_ERROR, [`Unknown PToken type "${pToken.type}" encountered.`]));
            this.push(pToken);
      }

      done();
   }

}

export default PToXTokenStream;
