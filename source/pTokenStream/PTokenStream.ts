/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { Readable } from 'stream';

import { CONFORMANCE_VERSION, ConformanceVersion, XmlVersion, XmlRevision, EntityId } from 'basic';
import { ParseToken,   parseInstruction, TextPToken,} from 'pToken';
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
   parseParameterEntityReference,
   parseSpace,
   ELEMENT_START_PTOKEN,
   CharDataPToken,
   ConditionalClosePToken,
   ConditionalPToken,

   ElementStartPToken,
} from 'token';
import { DocTypeStartPToken } from '../token/docTypeStart';
import { ContextType } from 'pToken';

type DeliverPToken = (result: ParseToken | null | undefined | Array<ParseToken>) => void; // icky typeHack
enum ConditionalState {
   NONE,
   INCLUDE,
   IGNORE,
   INSIDE_IGNORE,
}

interface PTokenOptions {
   context?: ContextType;
   confVer?: ConformanceVersion;
   entityId?: EntityId;
}

const VERSION_REGEXP = /version=("([^"]*)"|'([^']*)')/i;
const WHITESPACE_REGEXP = /[\n\t ]+/g;

class PTokenStream extends Readable {
   private _sTokenSource: STokenSource;
   private _elementStack: Array<ElementStartPToken>;
   private _parsing = false;
   private inContent: boolean;
   private pushedMetadata: boolean;
   private id: EntityId;
   private confVer: ConformanceVersion;
   private setConfVer: boolean;
   private context: ContextType = ContextType.DOCUMENT;
   private waitingForInternalClose = false;
   private conditionalStack: Array<ConditionalState> = [];
   private startDocType?: DocTypeStartPToken;

   constructor(sTokenSource: STokenSource, options: PTokenOptions = { context: ContextType.DOCUMENT }) {
      super({
         objectMode: true,
      });

      this._elementStack = [];
      this.context = options.context || ContextType.DOCUMENT;
      this.inContent = options.context === ContextType.GENERAL_ENTITY;
      this.pushedMetadata = false;
      this.id = options.entityId ?? new EntityId('./document.xml');
      this._sTokenSource = sTokenSource;

      // We should always get a confVer if we are not the document type.
      this.confVer = options.confVer ? new ConformanceVersion(options.confVer) : new ConformanceVersion();
      this.setConfVer = !!options.confVer;

      // In all other contexts, the EntityExpander will already have set the ConformanceVersion on the sTokenSource
      if (this.context === ContextType.DOCUMENT) {
         this._sTokenSource.setConfVer(this.confVer);
      }
   }

   addText(text: string) {
      this._sTokenSource.addText(text);
   }

   endText() {
      this._sTokenSource.endText();
   }

   _read() {
      if (!this.pushedMetadata && this.context === ContextType.DOCUMENT) {
         this.examineDeclaration();
         return;
      }

      this.pushedMetadata = true;

      if (this._parsing) {
         return;
      }
      this._parsing = true;
      this._parseGeneral((result) => {
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
               this.inContent = true;
               this._elementStack.push(result);
            } else if (result.type === ELEMENT_END_PTOKEN) {
               const name = resultName;
               const topToken = this._elementStack[this._elementStack.length - 1];
               const topSToken = (topToken as any || {}).name; // typeHack
               const topName = strOrBlank(topSToken);

               if (name === topName) {
                  this._elementStack.pop();
                  // We are always inContent if we are in a general entity. do not change that.
                  if (this.context !== ContextType.GENERAL_ENTITY) {
                     this.inContent = this._elementStack.length > 0;
                  }
               }
            }
         }

         this._parsing = false;
         this.push(result || null);
      });
   }

   _parseGeneral(deliverParse: DeliverPToken) {
      if (this.inContent) {
         this._parseContent(deliverParse);

      } else {
         const conditionalState = this.conditionalStack.length === 0 ? ConditionalState.NONE : this.conditionalStack[this.conditionalStack.length - 1];

         if (conditionalState === ConditionalState.IGNORE || conditionalState === ConditionalState.INSIDE_IGNORE) {
            this._sTokenSource.extract('multi', [ '<![', ']]>' ], (sToken) => {
               const valueFound = strOrBlank(sToken);

               if (!sToken) {
                  this._sTokenSource.extract('all', [ '<![', ']]>' ], (sToken) => {
                     if (!sToken) {
                        deliverParse(null);
                     } else {
                        deliverParse(new TextPToken({ text: sToken }));
                     }
                  });
                  return;
               }

               switch (valueFound) {
                  case '<![':
                     deliverParse(new TextPToken({ text: sToken }));
                     this.conditionalStack.push(ConditionalState.INSIDE_IGNORE);
                     break;
                  case ']]>':
                     this.conditionalStack.pop();

                     if (conditionalState === ConditionalState.INSIDE_IGNORE) {
                        deliverParse(new TextPToken({ text: sToken }));
                     } else {
                        const conditionalClose = new ConditionalClosePToken({ open: sToken });
                        deliverParse(conditionalClose);
                     }
                     break;
               }
            });
            return;
         }

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
            case ']':
               if (this.conditionalStack.length > 0) {
                  this._sTokenSource.extract('match', ']]>', (sToken) => {
                     if (sToken) {
                        this.conditionalStack.pop();
                        const conditionalClose = new ConditionalClosePToken({ open: sToken });
                        deliverParse(conditionalClose);
                     } else if (this.waitingForInternalClose) {
                        this.waitingForInternalClose = false;
                        this._parseClose(deliverParse);
                     } else {
                        parseCharData(this._sTokenSource, [], deliverParse);
                     }
                  });
               } else if (this.waitingForInternalClose) {
                  this.waitingForInternalClose = false;
                  this._parseClose(deliverParse);
               } else {
                  this._sTokenSource.extract('match', ']]>', (sToken) => {
                     // Our trouble is if we are matching ]]> we'll never continue.  So, we
                     if (sToken) {
                        deliverParse(new CharDataPToken({ text: sToken }));
                     } else {
                        this._sTokenSource.extractNoParams('char', (sToken) => {
                           // Our trouble is if we are matching ]]> we'll never continue.  So, we
                           if (sToken) {
                              deliverParse(new CharDataPToken({ text: sToken }));
                           }
                        });
                     }
                  });
               }
               break;
            default:
               if (sToken.str === '%' && !this.inContent) {
                  parseParameterEntityReference(this._sTokenSource, deliverParse);
               } else {
                  let terminators: Array<string> = [];

                  if (this.waitingForInternalClose) {
                     terminators = [ '%', ']' ];
                  }

                  parseCharData(this._sTokenSource, terminators, (result) => {
                     deliverParse(result);
                  });
               }
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
               parseInstruction(this._sTokenSource, markupStartSToken, this.context === ContextType.DOCUMENT, deliverParse);
               break;
            case '<!--':
               parseComment(this._sTokenSource, markupStartSToken, deliverParse);
               break;
            case '<!':
               parseDeclaration(this._sTokenSource, markupStartSToken, (pToken) => {
                  if (pToken instanceof DocTypeStartPToken && pToken.openSubset) {
                     this.waitingForInternalClose = true;
                     this.startDocType = pToken;
                  }
                  deliverParse(pToken as any);
               });
               break;
            case '<![':
               parseSection(this._sTokenSource, markupStartSToken, (section) => {
                  if (section instanceof ConditionalPToken) {
                     const type = strOrBlank(section.sectionType);

                     if (type.toLocaleLowerCase() === 'include') {
                        this.conditionalStack.push(ConditionalState.INCLUDE);
                     } else {
                        this.conditionalStack.push(ConditionalState.IGNORE);
                     }
                  }
                  deliverParse(section);
               });
               break;
         }
      });
   }

   _parseClose(deliverParse: DeliverPToken) {
      parseDocTypeEnd(this._sTokenSource, this.startDocType!, deliverParse);
   }

   /*
    * Try to peek at the XML Declaration. If it is present, and we have not
    * already had an XML version imposed on us, use the information from
    * the declaration to set what versin of the specification we will use
    * to do our processing, and feed that information into the stream.
    */
   private examineDeclaration() {
      this._sTokenSource.extractNoParams('peekDecl', (sToken) => {
         if (sToken && !this.setConfVer) {
            const processedString = sToken.str.replace(WHITESPACE_REGEXP, '');
            const match = VERSION_REGEXP.exec(processedString);

            if (match) {
               const versionNumber = match[2];

               this.confVer = new ConformanceVersion(versionNumber === '1.1' ? 1.1 : 1);
               this._sTokenSource.setConfVer(this.confVer);
            }
         }

         this.setConfVer = true;
         this.pushedMetadata = true;
         this.push(this.confVer);
         this.push(this.id);
      });
   }
}

export default PTokenStream;
