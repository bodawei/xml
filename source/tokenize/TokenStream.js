/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';
import { EntityMetaData } from '../basic';

import {
   charData,
   declaration,
   docTypeStart,
   docTypeEnd,
   xmlDeclaration,
   elementEnd,
   elementStart,
   entityDeclaration,
   entityReference,
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
         case charData.TYPE:
            this.push(charData.makeToken(parsed));
            break;
         case declaration.TYPE:
            this.push(declaration.makeToken(parsed));
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
            this.push(elementStart.makeToken(parsed));
            break;
         case entityDeclaration.TYPE:
            this.push(entityDeclaration.makeToken(parsed));
            break;
         case entityReference.TYPE:
            this.push(entityReference.makeToken(parsed));
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
