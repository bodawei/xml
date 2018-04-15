/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { EntityMetaData } from '../basic';
import { defaultExtractors } from '../extractor';
import { STokenSource } from '../sToken';
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
   elementStart,
   elementEnd,
   elementDeclaration,
   entityDeclaration,
   entityReference,
   notationDeclaration,
   processingInstruction,
   space,
   xmlDeclaration,
} from '../token';

class PTokenStream extends stream.Readable {

   constructor(metaDataOrTokenSource) {
      super({
         objectMode: true,
      });

      if (metaDataOrTokenSource instanceof STokenSource) {
         this._sTokenSource = metaDataOrTokenSource;
      } else {
         this._sTokenSource = new STokenSource(defaultExtractors, metaDataOrTokenSource || new EntityMetaData());
      }

      this._reportedMetaData = false;
   }

   addText(text) {
      this._sTokenSource.addText(text);
   }

   endText() {
      this._sTokenSource.endText();
   }

   _read() {
      if (this._parsing) {
         return;
      }
      this._parsing = true;
      this._parseGeneral((result) => {
         if (!this._reportedMetaData) {
            this._reportedMetaData = true;
            this.push(this._sTokenSource.metaData);
         }

         if (Array.isArray(result)) {
            for (let index = 0; index < result.length - 1; index++) {
               this.push(result[index]);
            }
            result = result[result.length - 1];
         }

         this._parsing = false;
         this.push(result || null);
      });
   }

   _parseGeneral(deliverParse) {
      space.parse(this._sTokenSource, (pToken) => {
         if (pToken.text) {
            deliverParse(pToken);
            return;
         }

         this._sTokenSource.extract('peekChar', (sToken) => {
            if (!sToken) {
               deliverParse(null);
               return;
            }
            switch (sToken.str) {
               case '<':
                  this._markupParse(deliverParse);
                  break;
               case '&':
                  entityReference.parse(this._sTokenSource, deliverParse);
                  break;
               case '%':
                  entityReference.paramParse(this._sTokenSource, deliverParse);
                  break;
               case ']':
                  if (this.waitingForInternalClose) {
                     this._parseClose(deliverParse);
                     this.waitingForInternalClose = false;
                  } else {
                     charData.parse(this._sTokenSource, (charPToken) => {
                        if (charPToken && charPToken.text) {
                           deliverParse(charPToken);
                        } else {
                           this._sTokenSource.extract('match', ']]>', (sToken) => {
                              deliverParse({
                                 type: 'CHARDATA',
                                 text: sToken,
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

                  charData.parse(this._sTokenSource, terminators, (result) => {
                     deliverParse(result);
                  });
                  break;
            }
         });
      });
   }

   _markupParse(deliverParse) {
      this._sTokenSource.extract('markup', (markupStartSToken) => {
         switch (markupStartSToken.str) {
            case '<':
               elementStart.parse(this._sTokenSource, markupStartSToken, deliverParse);
               break;
            case '</':
               elementEnd.parse(this._sTokenSource, markupStartSToken, deliverParse);
               break;
            case '<?':
               instruction.parse(this._sTokenSource, markupStartSToken, (pToken) => {
                  const target = pToken.target ? pToken.target.str : '';

                  if (target.toLocaleUpperCase() === 'XML') {
                     xmlDeclaration.parse(this._sTokenSource, pToken, deliverParse);
                  } else {
                     processingInstruction.parse(this._sTokenSource, pToken, deliverParse);
                  }
               });
               break;
            case '<!--':
               comment.parse(this._sTokenSource, markupStartSToken, deliverParse);
               break;
            case '<!':
               declaration.parse(this._sTokenSource, markupStartSToken, (pToken) => {
                  if (!pToken.declType) {
                     deliverParse(pToken);
                     return;
                  }

                  switch (pToken.declType.str.toLocaleUpperCase()) {
                     case 'DOCTYPE':
                        docTypeStart.parse(this._sTokenSource, pToken, (docTypeStart) => {
                           if (docTypeStart.startInternalSubset) {
                              this.waitingForInternalClose = true;
                              deliverParse(docTypeStart);
                           } else {
                              docTypeEnd.parse(this._sTokenSource, (endToken) => {
                                 deliverParse([ docTypeStart, endToken ]);
                              });
                           }
                        });
                        break;
                     case 'ATTLIST':
                        attListDeclaration.parse(this._sTokenSource, pToken, deliverParse);
                        break;
                     case 'ELEMENT':
                        elementDeclaration.parse(this._sTokenSource, pToken, deliverParse);
                        break;
                     case 'ENTITY':
                        entityDeclaration.parse(this._sTokenSource, pToken, deliverParse);
                        break;
                     case 'NOTATION':
                        notationDeclaration.parse(this._sTokenSource, pToken, deliverParse);
                        break;
                     default:
                        deliverParse(pToken);
                        break;
                  }
               });
               break;
            case '<![':
               envelope.parse(this._sTokenSource, markupStartSToken, (pToken) => {
                  if (!pToken.envelopeType) {
                     deliverParse(pToken);
                     return;
                  }

                  switch (pToken.envelopeType.str.toLocaleUpperCase()) {
                     case 'CDATA':
                        cdata.parse(this._sTokenSource, pToken, deliverParse);
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
      docTypeEnd.parse(this._sTokenSource, deliverParse);
   }

}

export default PTokenStream;
