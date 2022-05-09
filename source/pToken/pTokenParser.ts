/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, EntityId } from 'basic';
import {
   ParseType,
   ParseToken,
   parseInstruction,
   parseParameterEntityReference,
   parseGeneralEntityReference,
   TextPToken,
   parseCharRef,
} from 'pToken';
import { strOrBlank, STokenSource } from 'sToken';
import {
   DOCTYPE_START_PTOKEN,
   ELEMENT_END_PTOKEN,
   ELEMENT_START_PTOKEN,
   parseCharData,
   parseSection,
   parseComment,
   parseDeclaration,
   parseDocTypeEnd,
   parseElementEnd,
   parseElementStart,
   parseSpace,
   CharDataPToken,
   ConditionalEndPToken,
   ConditionalStartPToken,
   DocTypeStartPToken,
   ElementStartPToken,
   SpacePToken,
} from 'token';

type DeliverPToken = (result: ParseToken | undefined | Array<ParseToken>) => void;

interface PTokenOptions {
   parseType?: ParseType;
   confVer?: ConformanceVersion;
   entityId?: EntityId;
}

enum ConditionalState {
   NONE,
   INCLUDE,
   IGNORE,
   INSIDE_IGNORE,
}

const VERSION_REGEXP = /version=("([^"]*)"|'([^']*)')/i;
const ALL_QUOTES_REGEXP = /['"]/g;
const WHITESPACE_REGEXP = /[\n\t ]+/g;

class PTokenParser {
   private conditionalStack: Array<ConditionalState> = [];

   private confVer: ConformanceVersion;

   private docTypeStart?: DocTypeStartPToken;

   private elementStack: Array<ElementStartPToken>;

   private entityId: EntityId;

   private inContent: boolean;

   private isConfVerDelivered: boolean;

   private isEntityIdDelivered: boolean;

   private isParsing = false;

   private parseType: ParseType = ParseType.DOCUMENT;

   private sTokenSource: STokenSource;

   constructor(
      sTokenSource: STokenSource,
      options: PTokenOptions = { parseType: ParseType.DOCUMENT },
   ) {
      this.elementStack = [];
      this.entityId = options.entityId ?? new EntityId('./document.xml');
      this.inContent = options.parseType === ParseType.GENERAL_ENTITY;
      this.isConfVerDelivered = !!options.confVer;
      this.isEntityIdDelivered = false;
      this.parseType = options.parseType || ParseType.DOCUMENT;
      this.sTokenSource = sTokenSource;
      // We should always get a confVer if we are not the document type.
      this.confVer = new ConformanceVersion(options.confVer);

      // In all other contexts, the EntityExpander will already have set the ConformanceVersion on the sTokenSource
      if (this.parseType === ParseType.DOCUMENT) {
         this.sTokenSource.setConfVer(this.confVer);
      }
   }

   public parse(done: DeliverPToken): void {
      if (!this.isEntityIdDelivered && this.parseType === ParseType.DOCUMENT) {
         this.examineDeclaration(done);
         return;
      }

      if (this.isParsing) {
         done(undefined); // this is a real big problem.  undefined means "nothing else to parse"
         return;
      }

      this.isParsing = true;

      if (this.inContent) {
         this.parseContent((result) => {
            this.handleGeneralDone(result, done);
         });
         return;
      }

      const conditionalState =
         this.conditionalStack.length === 0
            ? ConditionalState.NONE
            : this.conditionalStack[this.conditionalStack.length - 1];

      if (
         conditionalState === ConditionalState.IGNORE ||
         conditionalState === ConditionalState.INSIDE_IGNORE
      ) {
         this.sTokenSource.extract('multi', ['<![', ']]>'], (sToken) => {
            if (!sToken) {
               this.sTokenSource.extract('all', ['<![', ']]>'], (sToken) => {
                  if (!sToken) {
                     this.handleGeneralDone(undefined, done);
                  } else {
                     this.handleGeneralDone(new TextPToken({ text: sToken }), done);
                  }
               });
               return;
            }

            switch (strOrBlank(sToken)) {
               case '<![':
                  this.handleGeneralDone(new TextPToken({ text: sToken }), done);
                  this.conditionalStack.push(ConditionalState.INSIDE_IGNORE);
                  break;
               case ']]>':
                  this.conditionalStack.pop();

                  if (conditionalState === ConditionalState.INSIDE_IGNORE) {
                     this.handleGeneralDone(new TextPToken({ text: sToken }), done);
                  } else {
                     const conditionalClose = new ConditionalEndPToken({ open: sToken });
                     this.handleGeneralDone(conditionalClose, done);
                  }
                  break;
            }
         });
      } else {
         parseSpace(this.sTokenSource, (pToken: SpacePToken | undefined) => {
            if (pToken) {
               this.handleGeneralDone(pToken, done);
               return;
            }

            this.parseContent((result) => {
               this.handleGeneralDone(result, done);
            });
         });
      }
   }

   private handleGeneralDone(
      result: ParseToken | Array<ParseToken> | undefined,
      done: DeliverPToken,
   ): void {
      let tokens: Array<ParseToken> | ParseToken | undefined = result;

      if (Array.isArray(result)) {
         // docstart and end may deliver an array(!)
         tokens = result;
         result = result[result.length - 1];
      }

      switch (result?.type) {
         case ELEMENT_START_PTOKEN:
            this.inContent = true;
            this.elementStack.push(result);
            break;
         case ELEMENT_END_PTOKEN:
            const resultName = strOrBlank(result.name);
            const topToken = this.elementStack[this.elementStack.length - 1];
            const topName = strOrBlank(topToken ? topToken.name : undefined);

            if (resultName === topName) {
               this.elementStack.pop();
               // We are always inContent if we are in a general entity. do not change that.
               if (this.parseType !== ParseType.GENERAL_ENTITY) {
                  this.inContent = this.elementStack.length > 0;
               }
            }
            break;
         default:
            // do nothing
            break;
      }

      this.isParsing = false;

      done(tokens);
   }

   /*
    * Try to peek at the XML Declaration. If it is present, and we have not
    * already had an XML version imposed on us, use the information from
    * the declaration to set what versin of the specification we will use
    * to do our processing, and feed that information into the stream.
    */
   private examineDeclaration(done: DeliverPToken): void {
      this.sTokenSource.extractNoParams('peekDecl', (sToken) => {
         if (sToken && !this.isConfVerDelivered) {
            const processedString = sToken.str.replace(WHITESPACE_REGEXP, '');
            const match = VERSION_REGEXP.exec(processedString);

            if (match) {
               const versionNumber = match[1].replace(ALL_QUOTES_REGEXP, '');

               this.confVer = new ConformanceVersion(versionNumber === '1.1' ? 1.1 : 1);
               this.sTokenSource.setConfVer(this.confVer);
            }
         }

         this.isConfVerDelivered = true;
         this.isEntityIdDelivered = true;
         done([this.confVer, this.entityId]);
      });
   }

   private parseContent(deliverParse: DeliverPToken): void {
      this.sTokenSource.extractNoParams('peekChar', (sToken) => {
         if (!sToken) {
            deliverParse(undefined);
            return;
         }

         switch (sToken.str) {
            case '<':
            case '&':
               this.parseMarkup(deliverParse);
               break;
            case ']':
               if (this.conditionalStack.length > 0) {
                  this.sTokenSource.extract('match', ']]>', (sToken) => {
                     if (sToken) {
                        this.conditionalStack.pop();
                        const conditionalClose = new ConditionalEndPToken({ open: sToken });
                        deliverParse(conditionalClose);
                     } else if (this.docTypeStart) {
                        parseDocTypeEnd(this.sTokenSource, this.docTypeStart, deliverParse);
                        this.docTypeStart = undefined;
                     } else {
                        parseCharData(this.sTokenSource, [], deliverParse);
                     }
                  });
               } else if (this.docTypeStart) {
                  parseDocTypeEnd(this.sTokenSource, this.docTypeStart, deliverParse);
                  this.docTypeStart = undefined;
               } else {
                  this.sTokenSource.extract('match', ']]>', (sToken) => {
                     // Our trouble is if we are matching ]]> we'll never continue.  So, we
                     if (sToken) {
                        deliverParse(new CharDataPToken({ text: sToken }));
                     } else {
                        this.sTokenSource.extractNoParams('char', (sToken) => {
                           // Our trouble is if we are matching ]]> we'll never continue.  So, we
                           if (sToken) {
                              deliverParse(new CharDataPToken({ text: sToken }));
                           } else {
                              deliverParse(undefined);
                           }
                        });
                     }
                  });
               }
               break;
            default:
               if (sToken.str === '%' && !this.inContent) {
                  parseParameterEntityReference(this.sTokenSource, deliverParse);
               } else {
                  const terminators: Array<string> = this.docTypeStart ? ['%', ']'] : [];

                  parseCharData(this.sTokenSource, terminators, deliverParse);
               }
               break;
         }
      });
   }

   private parseMarkup(deliverParse: DeliverPToken): void {
      this.sTokenSource.extractNoParams('markup', (result) => {
         switch (result?.str) {
            case '&':
               parseGeneralEntityReference(this.sTokenSource, result, deliverParse);
               break;
            case '&#':
               parseCharRef(this.sTokenSource, result, deliverParse);
               break;
            case '<':
               parseElementStart(this.sTokenSource, result, deliverParse);
               break;
            case '</':
               parseElementEnd(this.sTokenSource, result, deliverParse);
               break;
            case '<?':
               const isDoc = this.parseType === ParseType.DOCUMENT;
               parseInstruction(this.sTokenSource, result, isDoc, deliverParse);
               break;
            case '<!--':
               parseComment(this.sTokenSource, result, deliverParse);
               break;
            case '<!':
               parseDeclaration(this.sTokenSource, result, (pToken) => {
                  if (
                     !Array.isArray(pToken) &&
                     pToken.type === DOCTYPE_START_PTOKEN &&
                     pToken.openSubset
                  ) {
                     this.docTypeStart = pToken;
                  }
                  deliverParse(pToken);
               });
               break;
            case '<![':
               parseSection(this.sTokenSource, result, (section) => {
                  if (section instanceof ConditionalStartPToken) {
                     const isInclude = strOrBlank(section.sectionType).toLowerCase() === 'include';
                     const cond = isInclude ? ConditionalState.INCLUDE : ConditionalState.IGNORE;

                     this.conditionalStack.push(cond);
                  }

                  deliverParse(section);
               });
               break;
            default:
               deliverParse(undefined);
         }
      });
   }
}

export { PTokenOptions, PTokenParser };
