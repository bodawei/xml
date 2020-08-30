/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { Readable } from 'stream';

import { EntityMetaData, EntityKind, XmlVersion, XmlRevision, EntityLocation } from 'basic';
import { defaultExtractors } from 'extractor';
import { ParseValue } from 'pToken';
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
   CharDataPToken,
   ConditionalClosePToken,
   ConditionalPToken,
   TextPToken,
   XMLDECL_PTOKEN,
   ElementStartPToken,
} from 'token';
import { DocTypeStartPToken } from '../token/docTypeStart';
import { ContextType } from 'pToken';
import { ConformanceVersion, CONFORMANCE_VERSION } from 'source/pToken/token/conformanceVersion';
import { EntityUri, ENTITY_URI } from 'source/pToken/token/entityUri';

type DeliverPToken = (result: ParseValue | null | undefined | Array<ParseValue>) => void; // icky typeHack
enum ConditionalState {
   NONE,
   INCLUDE,
   IGNORE,
   INSIDE_IGNORE,
}

interface PTokenOptions {
   context?: ContextType.CONTENT | ContextType.DOCUMENT | ContextType.EXTERNAL_ENTITY;
   version?: XmlVersion;
   revision?: XmlRevision;
   location?: EntityLocation;
}

class PTokenStream extends Readable {
   private _sTokenSource: STokenSource;
   private _elementStack: Array<ElementStartPToken>;
   private inContent: boolean;
   private _reportedMetaData: boolean;
   private _parsing: boolean = false;
   private emd: EntityMetaData;
   private id: EntityUri;
   private confVer: ConformanceVersion;
   private versionSet: boolean;
   private waitingForInternalClose: boolean = false;
   private conditionalStack: Array<ConditionalState> = [];
   private startDocType?: DocTypeStartPToken;

   constructor(metaDataOrTokenSource: STokenSource | EntityMetaData | undefined, options?: PTokenOptions) {
      super({
         objectMode: true,
      });

      this.versionSet = false;
      this.confVer = {
         type: CONFORMANCE_VERSION,
         version: 1,
         revision: 5,
      };

      if (metaDataOrTokenSource instanceof STokenSource) {
         this.emd = new EntityMetaData(EntityKind.DOCUMENT);
         this._sTokenSource = metaDataOrTokenSource;
      } else if (metaDataOrTokenSource) {
         this.emd = metaDataOrTokenSource;
         this.confVer = {
            type: CONFORMANCE_VERSION,
            version: metaDataOrTokenSource.version,
            revision: metaDataOrTokenSource.revision,
         };
         this.versionSet = true;
         this._sTokenSource = new STokenSource(defaultExtractors, metaDataOrTokenSource);
      } else {
         this.emd = new EntityMetaData(EntityKind.DOCUMENT);
         this._sTokenSource = new STokenSource(defaultExtractors, this.emd);
      }

      let opts: PTokenOptions;
      
      if (typeof options === 'boolean') {
         opts = { context: options ? ContextType.CONTENT : ContextType.DOCUMENT };
      }else {
         opts = options || { context: ContextType.DOCUMENT };
      }

      this._elementStack = [];
      this.inContent = opts.context === ContextType.CONTENT;
      this._reportedMetaData = false;
      this.id = {
         type: ENTITY_URI,
         location: options?.location ?? new EntityLocation('./index.xml'),
      };

      if (opts.version) {
               
         this.confVer = {
            type: CONFORMANCE_VERSION,
            version: opts.version,
            revision: opts.revision ?? (opts.version === 1 ? 5 : 2),
         };
         this.versionSet = true;
      }
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
            
            if (!this.versionSet) {
               let version = this._sTokenSource.metaData.version;
               let revision = this._sTokenSource.metaData.revision;

               if (result && !Array.isArray(result) && result.type === XMLDECL_PTOKEN) {
                  for (let param of result.params) {
                     if (strOrBlank(param.name) === 'version') {
                        version = strOrBlank(param.value) === '1.1' ? 1.1 : 1.0;
                        revision = version === 1.0 ? 5 : 2;
                     }
                  }
               }

               this.versionSet = true;
               this.confVer = {
                  type: CONFORMANCE_VERSION,
                  version,
                  revision,
               };
            }

            this.push(this.confVer);
            this.push(this.id);
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
               this.inContent = true;
               this._elementStack.push(result);
            } else if (result.type === ELEMENT_END_PTOKEN) {
               const name = resultName;
               const topToken = this._elementStack[this._elementStack.length - 1];
               const topSToken = (topToken as any || {}).name; // typeHack
               const topName = strOrBlank(topSToken);

               if (name === topName) {
                  this._elementStack.pop();
                  this.inContent = this._elementStack.length > 0;
               }
            }
         }

         this._parsing = false;
         this.push(result || null);
      });
   }

   _parseGeneral(deliverParse: DeliverPToken) {
      this.emd = this._sTokenSource.metaData;

      if (this.inContent) {
         this._parseContent(deliverParse);

      } else {
         const conditionalState = this.conditionalStack.length === 0 ? ConditionalState.NONE : this.conditionalStack[this.conditionalStack.length -1];

         if (conditionalState === ConditionalState.IGNORE || conditionalState === ConditionalState.INSIDE_IGNORE) {
            this._sTokenSource.extract('multi', ['<![', ']]>'] , (sToken) => {
               const valueFound = strOrBlank(sToken);

               if (!sToken) {
                  this._sTokenSource.extract('all', ['<![', ']]>'] , (sToken) => {
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
            case '%':
               parseParameterEntityReference(this._sTokenSource, deliverParse);
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
               let terminators: Array<string> = [];

               if (this.waitingForInternalClose) {
                  terminators = ['%'];
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
               parseInstruction(this._sTokenSource, markupStartSToken, this.emd.isDocumentKind, deliverParse);
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

}

export default PTokenStream;
