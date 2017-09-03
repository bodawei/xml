/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { declaration, processingInstruction } from '../token';

class Parser {

   parseGeneral(source, deliverParse) {
      source.extract('peekChar', (chunk) => {
         if (!chunk) {
            deliverParse(null);
            return;
         }

         switch (chunk.text) {
            case '<':
               return this._markupParse(source, deliverParse);
         }
      });
   }

   _markupParse(source, deliverParse) {
      source.extract('markup', (markupStartChunk) => {
         switch (markupStartChunk.text) {
            case '<?':
               return processingInstruction.parse(source, markupStartChunk, deliverParse);
            case '<!':
               return declaration.parse(source, markupStartChunk, deliverParse);
         }
      });
   }

}

module.exports = Parser;
