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
   xmlDeclaration,
} from '../xToken';

class TokenStream extends stream.Transform {

   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(parsed, _, done) {
      switch (parsed.type) {
         case EntityMetaData.TYPE:
            this.push(parsed);
            break;
         case declaration.TYPE:
            this.push(declaration.makeToken(parsed));
            break;
         case envelope.TYPE:
            this.push(envelope.makeToken(parsed));
            break;
         case instruction.TYPE:
            this.push(instruction.makeToken(parsed));
            break;
         case cdata.TYPE:
            this.push(cdata.makeToken(parsed));
            break;
         case charData.TYPE:
            this.push(charData.makeToken(parsed));
            break;
         case comment.TYPE:
            this.push(comment.makeToken(parsed));
            break;
         case docTypeStart.TYPE:
            this.push(docTypeStart.makeToken(parsed));
            break;
         case docTypeEnd.TYPE:
            this.push(docTypeEnd.makeToken(parsed));
            break;
         case elementEnd.TYPE:
            this.push(elementEnd.makeToken(parsed));
            break;
         case elementStart.TYPE:
         case elementStart.EMPTY_TYPE:
            this.push(elementStart.makeToken(parsed));
            break;
         case entityDeclaration.TYPE:
            this.push(entityDeclaration.makeToken(parsed));
            break;
         case entityReference.PARAM_TYPE:
         case entityReference.TYPE:
            this.push(entityReference.makeToken(parsed));
            break;
         case notationDeclaration.TYPE:
            this.push(notationDeclaration.makeToken(parsed));
            break;
         case processingInstruction.TYPE:
            this.push(processingInstruction.makeToken(parsed));
            break;
         case space.TYPE:
            this.push(space.makeToken(parsed));
            break;
         case xmlDeclaration.TYPE:
            this.push(xmlDeclaration.makeToken(parsed));
            break;
         default:
            this.push(new Error(`Unknown parsed type "${parsed.type}" encountered.`));
      }

      done();
   }

}

export default TokenStream;
