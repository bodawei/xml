/* Copyright ® 2017-2022 by 柏大衛. All rights reserved. */

import { ConformanceVersion, EntityId } from 'basic';
import {
   ParseType,
   ParseToken,
   parseXmlDecl,
   parsePlainInstruction,
   parseParameterEntityReference,
   parseGeneralEntityReference,
   TextPToken,
   parseCharRef,
} from 'pToken';
import { strOrBlank, SToken, STokenSource } from 'basic';
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
   ElementStartPToken,
   CONDITIONAL_START_PTOKEN,
   DocTypeStartPToken,
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

enum ParseState {
   UNSTARTED,
   PROLOG,
   DTD,
   AFTER_DTD,
   ELEMENT_CONTENT,
   POSTLOG,
}

const VERSION_REGEXP = /version=("([^"]*)"|'([^']*)')/i;
const ALL_QUOTES_REGEXP = /['"]/g;
const WHITESPACE_REGEXP = /[\n\t ]+/g;

class PTokenParser {
   private parseType: ParseType;

   private sTokenSource: STokenSource;

   private conditionalStack: Array<ConditionalState> = [];

   private data: Array<ParseToken | undefined>;

   private elementStack: Array<ElementStartPToken>;

   private options: PTokenOptions;

   private state: ParseState;

   private requests: Array<DeliverPToken>;

   private isParsing: boolean;

   private docStart?: DocTypeStartPToken;

   private markupMap: {
      [markupPRefix: string]: (
         source: STokenSource,
         start: SToken,
         processor: (token: ReadonlyArray<ParseToken> | ParseToken | undefined) => void,
      ) => void;
   };

   constructor(
      sTokenSource: STokenSource,
      options: PTokenOptions = { parseType: ParseType.DOCUMENT },
   ) {
      this.isParsing = false;
      this.conditionalStack = [];
      this.data = [];
      this.elementStack = [];
      this.requests = [];
      this.options = options;
      this.parseType = options.parseType ?? ParseType.DOCUMENT;
      this.state = ParseState.UNSTARTED;
      this.sTokenSource = sTokenSource;
      this.markupMap = {
         '&': parseGeneralEntityReference,
         '&#': parseCharRef,
         '<': parseElementStart,
         '<!': parseDeclaration,
         '<![': parseSection,
         '<!--': parseComment,
         '</': parseElementEnd,
         '<?': this.parseType === ParseType.DOCUMENT ? parseXmlDecl : parsePlainInstruction,
      };

      switch (this.parseType) {
         case ParseType.DOCUMENT:
            this.state = ParseState.UNSTARTED;
            break;
         case ParseType.GENERAL_ENTITY:
            this.state = ParseState.ELEMENT_CONTENT;
            break;
         case ParseType.EXTERNAL_SUBSET:
         case ParseType.PARAMETER_ENTITY:
            this.state = ParseState.DTD;
            break;
         // OTHER
      }
   }

   public parse(deliver: DeliverPToken): void {
      if (this.data.length > 0) {
         deliver(this.data.shift());
         return;
      }

      this.requests.push(deliver);

      this.parseToken();
   }

   private parseToken(): void {
      if (this.isParsing) {
         return;
      }
      if (this.requests.length <= 0) {
         return;
      }

      this.isParsing = true;
      if (this.state === ParseState.UNSTARTED) {
         this.examineDeclaration();
         return;
      }

      if (this.state === ParseState.ELEMENT_CONTENT) {
         this.findToken();
      } else {
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
                        this.pushToken(undefined);
                     } else {
                        this.pushToken(new TextPToken({ text: sToken }));
                     }
                  });
                  return;
               }

               switch (strOrBlank(sToken)) {
                  case '<![':
                     this.pushToken(new TextPToken({ text: sToken }));
                     this.conditionalStack.push(ConditionalState.INSIDE_IGNORE);
                     break;
                  case ']]>':
                     this.conditionalStack.pop();

                     if (conditionalState === ConditionalState.INSIDE_IGNORE) {
                        this.pushToken(new TextPToken({ text: sToken }));
                     } else {
                        const conditionalClose = new ConditionalEndPToken({ open: sToken });
                        this.pushToken(conditionalClose);
                     }
                     break;
               }
               return;
            });
            return;
         }

         parseSpace(this.sTokenSource, (spacePToken) => {
            if (spacePToken) {
               this.data.push(spacePToken);
            }

            this.findToken();
         });
      }
   }

   /*
    * Try to peek at the XML Declaration. If it is present, and we have not
    * already had an XML version imposed on us, use the information from
    * the declaration to set what versin of the specification we will use
    * to do our processing, and feed that information into the stream.
    */
   private examineDeclaration(): void {
      let confVer = new ConformanceVersion(this.options.confVer);
      const entityId = this.options.entityId ?? new EntityId('./document.xml');

      // In all other contexts, the EntityExpander will already have set the ConformanceVersion on the sTokenSource
      if (this.parseType !== ParseType.DOCUMENT) {
         this.state = ParseState.PROLOG;
         this.isParsing = false;
         this.parseToken();
         return;
      }

      if (this.options.confVer) {
         this.sTokenSource.setConfVer(confVer);
         this.state = ParseState.PROLOG;
         this.pushToken([confVer, entityId]);
      } else {
         this.sTokenSource.extractNoParams('peekDecl', (sToken) => {
            if (sToken) {
               const processedString = sToken.str.replace(WHITESPACE_REGEXP, '');
               const match = VERSION_REGEXP.exec(processedString);

               if (match) {
                  const versionNumber = match[1].replace(ALL_QUOTES_REGEXP, '');

                  confVer = new ConformanceVersion(versionNumber === '1.1' ? 1.1 : 1);
               }
            }

            this.sTokenSource.setConfVer(confVer);
            this.state = ParseState.PROLOG;
            this.pushToken([confVer, entityId]);
         });
      }
   }

   private findToken(): void {
      this.sTokenSource.extractNoParams('peekChar', (sToken) => {
         if (!sToken) {
            this.pushToken(undefined);
            return;
         }

         switch (sToken.str) {
            case '<':
            case '&':
               this.parseMarkup();
               break;
            case ']':
               if (this.conditionalStack.length > 0) {
                  this.sTokenSource.extract('match', ']]>', (sToken) => {
                     if (sToken) {
                        this.conditionalStack.pop();
                        const conditionalClose = new ConditionalEndPToken({ open: sToken });
                        this.pushToken(conditionalClose);
                     } else if (
                        this.state === ParseState.DTD &&
                        this.parseType === ParseType.DOCUMENT
                     ) {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        parseDocTypeEnd(this.sTokenSource, this.docStart!, (token) =>
                           this.pushToken(token),
                        );
                        this.state = ParseState.AFTER_DTD;
                     } else {
                        parseCharData(this.sTokenSource, [], (token) => this.pushToken(token));
                     }
                  });
                  // @@ WHY NOT RETURN
               } else if (this.state === ParseState.DTD && this.parseType === ParseType.DOCUMENT) {
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  parseDocTypeEnd(this.sTokenSource, this.docStart!, (token) =>
                     this.pushToken(token),
                  );
                  this.state = ParseState.AFTER_DTD;
               } else {
                  this.sTokenSource.extract('match', ']]>', (sToken) => {
                     // Our trouble is if we are matching ]]> we'll never continue.  So, we
                     if (sToken) {
                        this.pushToken(new CharDataPToken({ text: sToken }));
                     } else {
                        this.sTokenSource.extractNoParams('char', (sToken) => {
                           // Our trouble is if we are matching ]]> we'll never continue.  So, we
                           if (sToken) {
                              this.pushToken(new CharDataPToken({ text: sToken }));
                           } else {
                              this.pushToken(undefined);
                           }
                        });
                     }
                  });
               }
               break;
            default:
               if (sToken.str === '%' && this.state === ParseState.DTD) {
                  parseParameterEntityReference(this.sTokenSource, (token) =>
                     this.pushToken(token),
                  );
               } else {
                  const terminators: Array<string> =
                     this.state === ParseState.DTD ? ['%', ']'] : [];

                  parseCharData(this.sTokenSource, terminators, (token) => this.pushToken(token));
               }
               break;
         }
      });
   }

   private parseMarkup(): void {
      this.sTokenSource.extractNoParams('markup', (result) => {
         let parser = this.markupMap[result?.str ?? ''];

         // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
         parser = parser || function () {}; /// @@@ WRONG WRONG

         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
         parser(this.sTokenSource, result!, (token) => this.pushToken(token));
      });
   }

   private pushToken(tokens: ParseToken | ReadonlyArray<ParseToken> | undefined): void {
      if (tokens) {
         if (Array.isArray(tokens)) {
            for (const token of tokens) {
               this.updateState(token);
               this.data.push(token);
            }
         } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.updateState(tokens as any);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.data.push(tokens as any);
         }
      } else {
         this.data.push(undefined);
      }

      while (this.requests.length > 0 && this.data.length > 0) {
         const token = this.data.shift();
         const request = this.requests.shift();

         // @ts-expect-error ts2722 request could be undefined
         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- you can see above, this has to be non-null
         request(token);
      }

      this.isParsing = false;
      if (this.requests.length > 0) {
         this.parseToken();
      }
   }

   private updateState(token: ParseToken): void {
      // do our state changes based on the token
      switch (token.type) {
         case ELEMENT_START_PTOKEN:
            this.state = ParseState.ELEMENT_CONTENT;
            this.elementStack.push(token);
            break;
         case ELEMENT_END_PTOKEN:
            const resultName = strOrBlank(token.name);
            const topToken = this.elementStack[this.elementStack.length - 1];
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            const topName = strOrBlank(topToken ? topToken.name : undefined);

            if (resultName === topName) {
               this.elementStack.pop();
            }
            if (this.elementStack.length === 0 && this.parseType !== ParseType.GENERAL_ENTITY) {
               this.state = ParseState.POSTLOG;
            }
            break;
         case DOCTYPE_START_PTOKEN:
            if (this.state === ParseState.PROLOG) {
               this.state = ParseState.DTD;
               this.docStart = token;
            }
            break;
         case CONDITIONAL_START_PTOKEN:
            const isInclude = strOrBlank(token.sectionType).toLowerCase() === 'include';
            const cond = isInclude ? ConditionalState.INCLUDE : ConditionalState.IGNORE;

            this.conditionalStack.push(cond);
            break;
         default:
            // do nothing
            break;
      }
   }
}

export { PTokenOptions, PTokenParser };
