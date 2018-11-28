/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';
import { EntityMetaData } from '../basic';

import {
   declaration,

   attListDeclaration,
   charData,
   comment,
   docTypeStart,
   docTypeEnd,
   elementEnd,
   elementStart,
   elementDeclaration,
   entityDeclaration,
   notationDeclaration,
   space,
   text,

   CDATA_PTOKEN,
   PROCESSING_INSTRUCTION_PTOKEN,
   TEXTDECL_PTOKEN,
   XMLDECL_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
} from '../token';

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
         case charData.PTYPE:
            this.push(charData.pTokenToXToken(pToken));
            break;
         case comment.PTYPE:
            this.push(comment.pTokenToXToken(pToken));
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
         case entityDeclaration.PTYPE:
            this.push(entityDeclaration.pTokenToXToken(pToken));
            break;
         case notationDeclaration.PTYPE:
            this.push(notationDeclaration.pTokenToXToken(pToken));
            break;
         case space.PTYPE:
            this.push(space.pTokenToXToken(pToken));
            break;
         case text.PTYPE:
            this.push(text.makeXToken(pToken));
            break;
         case CDATA_PTOKEN:
         case GENERAL_ENTITY_REFERENCE_PTOKEN:
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
         case PROCESSING_INSTRUCTION_PTOKEN:
         case TEXTDECL_PTOKEN:
         case XMLDECL_PTOKEN:
            this.push(pToken.toXToken());
            break;
         default:
            if (pToken.type === EntityMetaData.TYPE) {
               this.push(pToken);
               break;
            }
            this.push(new Error(`Unknown PToken type "${pToken.type}" encountered.`));
      }

      done();
   }

}

export default PToXTokenStream;
