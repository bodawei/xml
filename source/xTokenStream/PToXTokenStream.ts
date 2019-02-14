/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { ENTITY_META_DATA } from 'basic';
import { WellFormedError } from 'error';
import {
   declaration,

   attListDeclaration,
   docTypeStart,
   docTypeEnd,
   elementEnd,
   elementStart,
   elementDeclaration,

   CDATA_PTOKEN,
   CHARDATA_PTOKEN,
   CHARREF_PTOKEN,
   COMMENT_PTOKEN,
   EXTERNAL_SUBSET_START_XTOKEN,
   EXTERNAL_SUBSET_END_XTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   INTERNAL_SUBSET_END_XTOKEN,
   INTERNAL_SUBSET_START_XTOKEN,
   NOTATION_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   PROCESSING_INSTRUCTION_PTOKEN,
   SPACE_PTOKEN,
   TEXT_PTOKEN,
   TEXTDECL_PTOKEN,
   XMLDECL_PTOKEN,
} from 'token';

class PToXTokenStream extends stream.Transform {

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
         case docTypeStart.PTYPE:
            this.push(docTypeStart.pTokenToXToken(pToken));
            break;
         case docTypeEnd.PTYPE:
            this.push(docTypeEnd.pTokenToXToken(pToken));
            break;
         case elementEnd.PTYPE:
            this.push(elementEnd.pTokenToXToken(pToken));
            break;
         case elementStart.PTYPE:
         case elementStart.EMPTY_TYPE:
            this.push(elementStart.pTokenToXToken(pToken));
            break;
         case elementDeclaration.PTYPE:
            this.push(elementDeclaration.pTokenToXToken(pToken));
            break;
         case CDATA_PTOKEN:
         case CHARDATA_PTOKEN:
         case CHARREF_PTOKEN:
         case COMMENT_PTOKEN:
         case GENERAL_ENTITY_DECLARATION_PTOKEN:
         case GENERAL_ENTITY_REFERENCE_PTOKEN:
         case NOTATION_DECLARATION_PTOKEN:
         case PARAMETER_ENTITY_DECLARATION_PTOKEN:
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
         case PROCESSING_INSTRUCTION_PTOKEN:
         case SPACE_PTOKEN:
         case TEXT_PTOKEN:
         case TEXTDECL_PTOKEN:
         case XMLDECL_PTOKEN:
            this.push(pToken.toXToken());
            break;
         case INTERNAL_SUBSET_START_XTOKEN:
         case INTERNAL_SUBSET_END_XTOKEN:
         case EXTERNAL_SUBSET_START_XTOKEN:
         case EXTERNAL_SUBSET_END_XTOKEN:
         case ENTITY_META_DATA:
            this.push(pToken);
            break;
         default:
            this.push(new WellFormedError(WellFormedError.ID.INTERNAL_ERROR, [ `Unknown PToken type "${pToken.type}" encountered.` ]));
            this.push(pToken);
      }

      done();
   }

}

export default PToXTokenStream;
