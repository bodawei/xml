/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';

import {
   ATTLIST_DECLARATION_PTOKEN,
   CHARREF_PTOKEN,
   ELEMENT_DECLARATION_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   NOTATION_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   PROCESSING_INSTRUCTION_PTOKEN,
   TEXTDECL_PTOKEN, XMLDECL_PTOKEN,
   TEXT_PTOKEN,
} from 'pToken';

import {
   declaration,

   CDATA_PTOKEN,
   CHARDATA_PTOKEN,
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
   GENERAL_ENTITY_START_PTOKEN,
   GENERAL_ENTITY_END_PTOKEN,
   INTERNAL_SUBSET_END_TOKEN,
   INTERNAL_SUBSET_START_TOKEN,
   
   PARAMETER_ENTITY_END_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
   SPACE_PTOKEN,

   ELIDED_ENTITY_DECLARATION_PTOKEN,
} from 'token';

import { convertPTokenToXToken } from 'xToken';

class PToXTokenStream extends Transform {

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(pToken: any, encoding: string, done: () => void) { // typeHack
      switch (pToken.type) {
         case declaration.PTYPE:
            this.push(declaration.pTokenToXToken(pToken));
            break;
         case CDATA_PTOKEN:
         case CHARDATA_PTOKEN:
         case COMMENT_PTOKEN:
         case DOCTYPE_END_PTOKEN:
         case DOCTYPE_START_PTOKEN:
         case ELEMENT_END_PTOKEN:
         case GENERAL_ENTITY_START_PTOKEN:
         case GENERAL_ENTITY_END_PTOKEN:
         case PARAMETER_ENTITY_END_PTOKEN:
         case PARAMETER_ENTITY_START_PTOKEN:
            this.push(pToken.toXToken());
            break;
         case CONDITIONAL_CLOSE_PTOKEN:
         case CONDITIONAL_PTOKEN:
         case ATTLIST_DECLARATION_PTOKEN:
         case CHARREF_PTOKEN:
         case ELEMENT_DECLARATION_PTOKEN:
         case ELEMENT_EMPTY_PTOKEN:
         case ELEMENT_START_PTOKEN:
         case GENERAL_ENTITY_REFERENCE_PTOKEN:
         case GENERAL_ENTITY_DECLARATION_PTOKEN:
         case NOTATION_DECLARATION_PTOKEN:
         case PARAMETER_ENTITY_DECLARATION_PTOKEN:
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
         case PROCESSING_INSTRUCTION_PTOKEN:
         case SPACE_PTOKEN:
         case TEXT_PTOKEN:
         case TEXTDECL_PTOKEN:
         case XMLDECL_PTOKEN:
            this.push(convertPTokenToXToken(pToken));
            break;
         case INTERNAL_SUBSET_START_TOKEN:
         case INTERNAL_SUBSET_END_TOKEN:
         case EXTERNAL_SUBSET_START_TOKEN:
         case EXTERNAL_SUBSET_END_TOKEN:
         case 'ERROR_TYPE':
            this.push(pToken);
            break;
         case ELIDED_ENTITY_DECLARATION_PTOKEN:
            break;
         default:
            this.push(pToken);
      }

      done();
   }

}

export default PToXTokenStream;
