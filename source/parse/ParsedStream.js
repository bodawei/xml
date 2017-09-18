/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { EntityMetaData } from '../basic';
import { LTokenSource, defaultExtractors } from '../lToken';
import {
   charData,
   comment,
   declaration,
   docTypeStart,
   docTypeEnd,
   elementStart,
   elementEnd,
   entityDeclaration,
   entityReference,
   instruction,
   notationDeclaration,
   processingInstruction,
   xmlDeclaration,
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
               instruction.parse(this._lTokenSource, markupStartLToken, (parsed) => {
                  const target = parsed.target ? parsed.target.text : '';

                  if (target.toLocaleUpperCase() === 'XML') {
                     xmlDeclaration.parse(this._lTokenSource, parsed, deliverParse);
                  } else {
                     processingInstruction.parse(this._lTokenSource, parsed, deliverParse);
                  }
               });
               break;
            case '<!--':
               comment.parse(this._lTokenSource, markupStartLToken, deliverParse);
               break;
            case '<!':
               declaration.parse(this._lTokenSource, markupStartLToken, (parsed) => {
                  if (!parsed.declType) {
                     deliverParse(parsed);
                     return;
                  }

                  switch (parsed.declType.text.toLocaleUpperCase()) {
                     case 'DOCTYPE':
                        docTypeStart.parse(this._lTokenSource, parsed, (docTypeStart) => {
                           if (docTypeStart.startInternalSubset) {
                              this.waitingForInternalClose = true;
                              deliverParse(docTypeStart);
                           } else {
                              docTypeEnd.parse(this._lTokenSource, (endToken) => {
                                 deliverParse(docTypeStart);
                                 deliverParse(endToken);
                              });
                           }
                        });
                        break;
                     case 'ENTITY':
                        entityDeclaration.parse(this._lTokenSource, parsed, deliverParse);
                        break;
                     case 'NOTATION':
                        notationDeclaration.parse(this._lTokenSource, parsed, deliverParse);
                        break;
                     default:
                        deliverParse(parsed);
                        break;
                  }
               });
               break;
         }
      });
   }

   _parseClose(deliverParse) {
      docTypeEnd.parse(this._lTokenSource, deliverParse);
   }

}

export default ParsedStream;
