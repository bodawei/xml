/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { EntityMetaData } from '../basic';
import { LTokenSource, defaultExtractors } from '../lToken';
import {
   declaration,
   processingInstruction,
   docTypeStart,
   docTypeEnd,
} from '../token';

class ParsedStream extends stream.Readable {

   constructor() {
      super({
         objectMode: true,
      });

      this._lTokenSource = new LTokenSource(defaultExtractors, new EntityMetaData());
   }

   addText(text) {
      this._lTokenSource.addText(text);
   }

   endText() {
      this._lTokenSource.endText();
   }

   _read() {
      this._parseGeneral((result) => {
         this.push(result || null);
      });
   }

   _parseGeneral(deliverParse) {
      this._lTokenSource.extract('peekChar', (lToken) => {
         if (!lToken) {
            deliverParse(null);
            return;
         }

         switch (lToken.text) {
            case '<':
               this._markupParse(deliverParse);
               break;
            case ']':
               if (this.waitingForInternalClose) {
                  this._parseClose(deliverParse);
                  this.waitingForInternalClose = false;
               }
         }
      });
   }

   _markupParse(deliverParse) {
      this._lTokenSource.extract('markup', (markupStartLToken) => {
         switch (markupStartLToken.text) {
            case '<?':
               return processingInstruction.parse(this._lTokenSource, markupStartLToken, deliverParse);
            case '<!':
               declaration.parse(this._lTokenSource, markupStartLToken, (token) => {
                  if (token.type !== docTypeStart.TYPE) {
                     deliverParse(token);
                     return;
                  }

                  if (token.startInternalSubsetLToken) {
                     this.waitingForInternalClose = true;
                     deliverParse(token);
                  } else {
                     docTypeEnd.parse(this._lTokenSource, (endToken) => {
                        deliverParse(token);
                        deliverParse(endToken);
                     });
                  }
               });
         }
      });
   }

   _parseClose(deliverParse) {
      docTypeEnd.parse(this._lTokenSource, deliverParse);
   }

}

export default ParsedStream;
