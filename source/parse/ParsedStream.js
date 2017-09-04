/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { EntityMetaData } from '../basic';
import { LTokenSource, defaultExtractors } from '../lToken';
import {
   charData,
   declaration,
   docTypeStart,
   docTypeEnd,
   elementStart,
   elementEnd,
   entityReference,
   processingInstruction,
} from '../xToken';

class ParsedStream extends stream.Readable {

   constructor(metaDataOrTokenSource) {
      super({
         objectMode: true,
      });

      if (metaDataOrTokenSource instanceof LTokenSource) {
         this._lTokenSource = metaDataOrTokenSource;
      } else {
         this._lTokenSource = new LTokenSource(defaultExtractors, metaDataOrTokenSource || new EntityMetaData());
      }

      this._reportedMetaData = false;
   }

   addText(text) {
      this._lTokenSource.addText(text);
   }

   endText() {
      this._lTokenSource.endText();
   }

   _read() {
      this._parseGeneral((result) => {
         if (!this._reportedMetaData) {
            this._reportedMetaData = true;
            this.push(this._lTokenSource.metaData);
         }
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
            case '&':
               entityReference.parse(this._lTokenSource, deliverParse);
               break;
            case ']':
               if (this.waitingForInternalClose) {
                  this._parseClose(deliverParse);
                  this.waitingForInternalClose = false;
               }
               break;
            default:
               charData.parse(this._lTokenSource, deliverParse);
               break;
         }
      });
   }

   _markupParse(deliverParse) {
      this._lTokenSource.extract('markup', (markupStartLToken) => {
         switch (markupStartLToken.text) {
            case '<':
               elementStart.parse(this._lTokenSource, markupStartLToken, deliverParse);
               break;
            case '</':
               elementEnd.parse(this._lTokenSource, markupStartLToken, deliverParse);
               break;
            case '<?':
               processingInstruction.parse(this._lTokenSource, markupStartLToken, deliverParse);
               break;
            case '<!':
               declaration.parse(this._lTokenSource, markupStartLToken, (token) => {
                  if (token.type !== docTypeStart.TYPE) {
                     deliverParse(token);
                     return;
                  }

                  if (token.startInternalSubset) {
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
