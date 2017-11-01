/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';
import { EntityMetaData } from '../basic';

import {
   declaration,
   envelope,
   instruction,

   cdata,
   charData,
   comment,
   docTypeStart,
   docTypeEnd,
   elementEnd,
   elementStart,
   entityDeclaration,
   entityReference,
   notationDeclaration,
   processingInstruction,
   space,
   text,
   xmlDeclaration,
} from '../xToken';

class TokenStream extends stream.Transform {

   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(pToken, _, done) {
      switch (pToken.type) {
         case EntityMetaData.TYPE:
            this.push(pToken);
            break;
         case declaration.TYPE:
            this.push(declaration.makeToken(pToken));
            break;
         case envelope.TYPE:
            this.push(envelope.makeToken(pToken));
            break;
         case instruction.TYPE:
            this.push(instruction.makeToken(pToken));
            break;
         case cdata.TYPE:
            this.push(cdata.makeToken(pToken));
            break;
         case charData.TYPE:
            this.push(charData.makeToken(pToken));
            break;
         case comment.TYPE:
            this.push(comment.makeToken(pToken));
            break;
         case docTypeStart.TYPE:
            this.push(docTypeStart.makeToken(pToken));
            break;
         case docTypeEnd.TYPE:
            this.push(docTypeEnd.makeToken(pToken));
            break;
         case elementEnd.TYPE:
            this.push(elementEnd.makeToken(pToken));
            break;
         case elementStart.TYPE:
         case elementStart.EMPTY_TYPE:
            this.push(elementStart.makeToken(pToken));
            break;
         case entityDeclaration.TYPE:
            this.push(entityDeclaration.makeToken(pToken));
            break;
         case entityReference.PARAM_TYPE:
         case entityReference.TYPE:
            this.push(entityReference.makeToken(pToken));
            break;
         case notationDeclaration.TYPE:
            this.push(notationDeclaration.makeToken(pToken));
            break;
         case processingInstruction.TYPE:
            this.push(processingInstruction.makeToken(pToken));
            break;
         case space.TYPE:
            this.push(space.makeToken(pToken));
            break;
         case text.TYPE:
            this.push(text.makeToken(pToken));
            break;
         case xmlDeclaration.TYPE:
            this.push(xmlDeclaration.makeToken(pToken));
            break;
         default:
            this.push(new Error(`Unknown parsed type "${pToken.type}" encountered.`));
      }

      done();
   }

}

export default TokenStream;
