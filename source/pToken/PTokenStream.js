/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { EntityMetaData } from '../basic';
import { LTokenSource, defaultExtractors } from '../lToken';
import {
   declaration,
   envelope,
   instruction,

   cdata,
   charData,
   comment,
   docTypeStart,
   docTypeEnd,
   elementStart,
   elementEnd,
   entityDeclaration,
   entityReference,
   notationDeclaration,
   processingInstruction,
   space,
   xmlDeclaration,
} from '../xToken';

class PTokenStream extends stream.Readable {

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
      space.parse(this._lTokenSource, (pToken) => {
         if (pToken.text) {
            deliverParse(pToken);
         }

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
               case '%':
                  entityReference.paramParse(this._lTokenSource, deliverParse);
                  break;
               case ']':
                  if (this.waitingForInternalClose) {
                     this._parseClose(deliverParse);
                     this.waitingForInternalClose = false;
                  } else {
                     charData.parse(this._lTokenSource, (result) => {
                        if (result && result.text) {
                           deliverParse(result);
                        } else {
                           this._lTokenSource.extract('match', ']]>', (lToken) => {
                              deliverParse({
                                 type: 'CHARDATA',
                                 text: lToken,
                              });
                           });
                        }
                     });
                  }
                  break;
               default:
                  let terminators = [];

                  if (this.waitingForInternalClose) {
                     terminators = [ '%' ];
                  }

                  charData.parse(this._lTokenSource, terminators, (result) => {
                     deliverParse(result);
                  });
                  break;
            }
         });
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
               instruction.parse(this._lTokenSource, markupStartLToken, (pToken) => {
                  const target = pToken.target ? pToken.target.text : '';

                  if (target.toLocaleUpperCase() === 'XML') {
                     xmlDeclaration.parse(this._lTokenSource, pToken, deliverParse);
                  } else {
                     processingInstruction.parse(this._lTokenSource, pToken, deliverParse);
                  }
               });
               break;
            case '<!--':
               comment.parse(this._lTokenSource, markupStartLToken, deliverParse);
               break;
            case '<!':
               declaration.parse(this._lTokenSource, markupStartLToken, (pToken) => {
                  if (!pToken.declType) {
                     deliverParse(pToken);
                     return;
                  }

                  switch (pToken.declType.text.toLocaleUpperCase()) {
                     case 'DOCTYPE':
                        docTypeStart.parse(this._lTokenSource, pToken, (docTypeStart) => {
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
                        entityDeclaration.parse(this._lTokenSource, pToken, deliverParse);
                        break;
                     case 'NOTATION':
                        notationDeclaration.parse(this._lTokenSource, pToken, deliverParse);
                        break;
                     default:
                        deliverParse(pToken);
                        break;
                  }
               });
               break;
            case '<![':
               envelope.parse(this._lTokenSource, markupStartLToken, (pToken) => {
                  if (!pToken.envelopeType) {
                     deliverParse(pToken);
                     return;
                  }

                  switch (pToken.envelopeType.text.toLocaleUpperCase()) {
                     case 'CDATA':
                        cdata.parse(this._lTokenSource, pToken, deliverParse);
                        break;
                     default:
                        deliverParse(pToken);
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

export default PTokenStream;
