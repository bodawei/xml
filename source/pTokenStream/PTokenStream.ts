/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { EntityMetaData, EntityKind } from 'basic';
import { defaultExtractors } from 'extractor';
import { strOrBlank, SToken, STokenSource } from 'sToken';
import {
   ELEMENT_END_PTOKEN,

   parseCharData,
   parseSection,

   parseCharRef,
   parseComment,
   parseDeclaration,
   parseDocTypeEnd,
   parseElementEnd,
   parseElementStart,
   parseGeneralEntityReference,
   parseInstruction,
   parseParameterEntityReference,
   parseSpace,
   ELEMENT_START_PTOKEN,
} from 'token';
import { DocTypeStartPToken } from '../token/docTypeStart';

type Token = { type: string, text?: SToken };
type DeliverPToken = (result: any) => void; // icky typeHack

class PTokenStream extends stream.Readable {
   private _sTokenSource: STokenSource;
   private _elementStack: Array<Token>;
   private _inContent: boolean;
   private _reportedMetaData: boolean;
   private _parsing: boolean = false;
   private emd: EntityMetaData;
   private waitingForInternalClose: boolean = false;
   private startDocType?: DocTypeStartPToken;

   constructor(metaDataOrTokenSource: STokenSource | EntityMetaData) {
      super({
         objectMode: true,
      });

      if (metaDataOrTokenSource instanceof STokenSource) {
         this.emd = new EntityMetaData(EntityKind.DOCUMENT);
         this._sTokenSource = metaDataOrTokenSource;
      } else {
         this.emd = metaDataOrTokenSource;
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
            const resultName = strOrBlank(resultSToken);

            if (result.type === ELEMENT_START_PTOKEN) {
               this._inContent = true;
               this._elementStack.push(result);
            } else if (result.type === ELEMENT_END_PTOKEN) {
               const name = resultName;
               const topToken = this._elementStack[this._elementStack.length - 1];
               const topSToken = (topToken as any || {}).name; // typeHack
               const topName = strOrBlank(topSToken);

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
         parseSpace(this._sTokenSource, (pToken: any) => {
            if (pToken) {
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
               parseParameterEntityReference(this._sTokenSource, deliverParse);
               break;
            case ']':
               if (this.waitingForInternalClose) {
                  this._parseClose(deliverParse);
                  this.waitingForInternalClose = false;
               } else {
                  parseCharData(this._sTokenSource, [], (charPToken) => {
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

               parseCharData(this._sTokenSource, terminators, (result) => {
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
               parseGeneralEntityReference(this._sTokenSource, markupStartSToken, deliverParse);
               break;
            case '&#':
               parseCharRef(this._sTokenSource, markupStartSToken, deliverParse);
               break;
            case '<':
               parseElementStart(this._sTokenSource, markupStartSToken, deliverParse);
               break;
            case '</':
               parseElementEnd(this._sTokenSource, markupStartSToken, deliverParse);
               break;
            case '<?':
               parseInstruction(this._sTokenSource, markupStartSToken, this.emd, deliverParse);
               break;
            case '<!--':
               parseComment(this._sTokenSource, markupStartSToken, deliverParse);
               break;
            case '<!':
               parseDeclaration(this._sTokenSource, markupStartSToken, this.emd, (pToken) => {
                  if (pToken instanceof DocTypeStartPToken && pToken.openSubset) {
                     this.waitingForInternalClose = true;
                     this.startDocType = pToken;
                  }

                  deliverParse(pToken);
               });
               break;
            case '<![':
               parseSection(this._sTokenSource, markupStartSToken, deliverParse);
               break;
         }
      });
   }

   _parseClose(deliverParse: DeliverPToken) {
      parseDocTypeEnd(this._sTokenSource, this.startDocType!, deliverParse);
   }

}

export default PTokenStream;
