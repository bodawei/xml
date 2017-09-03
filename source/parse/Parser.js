/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import {
   declaration,
   processingInstruction,
   docTypeStart,
   docTypeEnd,
} from '../token';

class Parser {

   parseGeneral(source, deliverParse) {
      source.extract('peekChar', (chunk) => {
         if (!chunk) {
            deliverParse(null);
            return;
         }

         switch (chunk.text) {
            case '<':
               this._markupParse(source, deliverParse);
            case ']':
               if (this.waitingForInternalClose) {
                  this._parseClose(source, deliverParse);
                  this.waitingForInternalClose = false;
               }
         }
      });
   }

   _markupParse(source, deliverParse) {
      source.extract('markup', (markupStartChunk) => {
         switch (markupStartChunk.text) {
            case '<?':
               return processingInstruction.parse(source, markupStartChunk, deliverParse);
            case '<!':
               declaration.parse(source, markupStartChunk, (token) => {
                  if (token.type !== docTypeStart.TYPE) {
                     deliverParse(token);
                     return;
                  }

                  if (token.hasInternalSubset) {
                     this.waitingForInternalClose = true;
                     deliverParse(token);
                  } else {
                     docTypeEnd.parse(source, (endToken) => {
                        deliverParse(token);
                        deliverParse(endToken);
                     });
                  }
               });
         }
      });
   }

   _parseClose(source, deliverParse) {
      docTypeEnd.parse(source, deliverParse);
   }

}

module.exports = Parser;
