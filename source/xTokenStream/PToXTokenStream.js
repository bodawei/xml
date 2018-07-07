/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';
import { EntityMetaData } from '../basic';

import {
   declaration,
   envelope,
   instruction,

   attListDeclaration,
   cdata,
   charData,
   comment,
   docTypeStart,
   docTypeEnd,
   elementEnd,
   elementStart,
   elementDeclaration,
   entityDeclaration,
   entityReference,
   notationDeclaration,
   processingInstruction,
   space,
   text,
   xmlDeclaration,
} from '../token';

class PToXTokenStream extends stream.Transform {

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(pToken, _, done) {
      switch (pToken.type) {
         case declaration.PTYPE:
            this.push(declaration.pTokenToXToken(pToken));
            break;
         case envelope.PTYPE:
            this.push(envelope.pTokenToXToken(pToken));
            break;
         case instruction.PTYPE:
            this.push(instruction.pTokenToXToken(pToken));
            break;
         case attListDeclaration.PTYPE:
            this.push(attListDeclaration.pTokenToXToken(pToken));
            break;
         case cdata.PTYPE:
            this.push(cdata.pTokenToXToken(pToken));
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
         case entityReference.PARAM_PTYPE:
         case entityReference.PTYPE:
            this.push(entityReference.pTokenToXToken(pToken));
            break;
         case notationDeclaration.PTYPE:
            this.push(notationDeclaration.pTokenToXToken(pToken));
            break;
         case processingInstruction.PTYPE:
            this.push(processingInstruction.pTokenToXToken(pToken));
            break;
         case space.PTYPE:
            this.push(space.pTokenToXToken(pToken));
            break;
         case text.PTYPE:
            this.push(text.makeXToken(pToken));
            break;
         case xmlDeclaration.PTYPE:
            this.push(xmlDeclaration.pTokenToXToken(pToken));
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
