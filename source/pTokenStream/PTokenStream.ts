/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { EntityMetaData } from '../basic';
import { defaultExtractors } from '../extractor';
import { SToken, STokenSource } from '../sToken';
import {
   declaration,
   parseSection,

   attListDeclaration,
   charData,
   charRef,
   comment,
   docTypeStart,
   docTypeEnd,
   elementStart,
   elementEnd,
   elementDeclaration,
   entityDeclaration,
   entityReference,
   notationDeclaration,
   space,

   parseInstruction,
} from '../token';
import { DocTypeStartPToken } from '../token/docTypeStart';
import { DocTypeEndPToken } from '../token/docTypeEnd';
import { textOrBlank } from 'source/token/common/misc';

type Token = { type: string, text?: SToken };
type DeliverPToken = (result: any) => void; // icky typeHack

class PTokenStream extends stream.Transform {
   private _sTokenSource: STokenSource;
   private _elementStack: Array<Token>;
   private _inContent: boolean;
   private _reportedMetaData: boolean;
   private _parsing: boolean = false;
   private waitingForInternalClose: boolean = false;

   constructor(metaDataOrTokenSource: STokenSource | EntityMetaData) {
      super({
         objectMode: true,
      });

      if (metaDataOrTokenSource instanceof STokenSource) {
         this._sTokenSource = metaDataOrTokenSource;
      } else {
         this._sTokenSource = new STokenSource(defaultExtractors, metaDataOrTokenSource);
      }

      this._elementStack = [];
      this._inContent = false;
      this._reportedMetaData = false;
   }

   addText(text: string) {
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

         // docstart and end may deliver an array(!)
         if (Array.isArray(result)) {
            for (let index = 0; index < result.length - 1; index++) {
               this.push(result[index]);
            }
            result = result[result.length - 1];
         }

         if (result) {
            const resultSToken = (result as any).name; // typeHack
            const resultName = textOrBlank(resultSToken);

            if (result.type === elementStart.PTYPE) {
               this._inContent = true;
               this._elementStack.push(result);
            } else if (result.type === elementEnd.PTYPE) {
               const name = resultName;
               const topToken = this._elementStack[this._elementStack.length - 1];
               const topSToken = (topToken as any || {}).name; // typeHack
               const topName = textOrBlank(topSToken);

               if (name === topName) {
                  this._elementStack.pop();
                  this._inContent = this._elementStack.length > 0;
               }
            }
         }

         this._parsing = false;
         this.push(result || null);
      });
   }

   _parseGeneral(deliverParse: DeliverPToken) {
      if (this._inContent) {
         this._parseContent(deliverParse);

      } else {
         space.parse(this._sTokenSource, (pToken: Token) => {
            if ((pToken as any).text) { // typeHack
               deliverParse(pToken);
               return;
            }

            this._parseContent(deliverParse);
         });
      }
   }

   _parseContent(deliverParse: DeliverPToken) {
      this._sTokenSource.extractNoParams('peekChar', (sToken) => {
         if (!sToken) {
            deliverParse(null);
            return;
         }
         switch (sToken.str) {
            case '<':
            case '&':
               this._markupParse(deliverParse);
               break;
            case '%':
               entityReference.paramParse(this._sTokenSource, deliverParse);
               break;
            case ']':
               if (this.waitingForInternalClose) {
                  this._parseClose(deliverParse);
                  this.waitingForInternalClose = false;
               } else {
                  charData.parse(this._sTokenSource, [], (charPToken: Token) => {
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
               let terminators: Array<string> = [];

               if (this.waitingForInternalClose) {
                  terminators = [ '%' ];
               }

               charData.parse(this._sTokenSource, terminators, (result: Token) => {
                  deliverParse(result);
               });
               break;
         }
      });
   }

   _markupParse(deliverParse: DeliverPToken) {
      this._sTokenSource.extractNoParams('markup', (result) => {
         const markupStartSToken = (result as any) as SToken; // typeHack
         switch (markupStartSToken.str) {
            case '&':
               entityReference.parse(this._sTokenSource, markupStartSToken, deliverParse);
               break;
            case '&#':
               charRef.parse(this._sTokenSource, markupStartSToken, deliverParse);
               break;
            case '<':
               elementStart.parse(this._sTokenSource, markupStartSToken, deliverParse);
               break;
            case '</':
               elementEnd.parse(this._sTokenSource, markupStartSToken, deliverParse);
               break;
            case '<?':
               parseInstruction(this._sTokenSource, markupStartSToken, deliverParse);
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
                        docTypeStart.parse(this._sTokenSource, pToken, (docTypeStart: DocTypeStartPToken) => {
                           if (docTypeStart.startInternalSubset) {
                              this.waitingForInternalClose = true;
                              deliverParse(docTypeStart);
                           } else {
                              docTypeEnd.parse(this._sTokenSource, (endToken: DocTypeEndPToken) => {
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
               parseSection(this._sTokenSource, markupStartSToken, deliverParse);
               break;
         }
      });
   }

   _parseClose(deliverParse: DeliverPToken) {
      docTypeEnd.parse(this._sTokenSource, deliverParse);
   }

}

export default PTokenStream;
