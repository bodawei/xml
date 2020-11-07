/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { combineSTokens, SToken, STokenSource } from 'sToken';

import { parseUnexpanded } from '../common/parseUnexpanded';
import { UnexpandedMarkupDetails } from '../types';

// ick
import { DeclarationStart } from '../../token/bridge/declaration';
import { AttributeValuePToken } from '../../token/common/attribute';
import literal from '../../token/common/literal';
import { parseWordList, WordListType, WordListPToken } from '../../token/common/wordList';

interface AttListDeclarationProps {
   open?: SToken;
   openSpace?: SToken;
   declType?: SToken;
   declTypeSpace?: SToken;
   elementName?: SToken;
   elementNameSpace?: SToken;
   attDefs?: Array<AttDefinition>;
   unexpanded?: UnexpandedMarkupDetails | undefined;
   extra?: SToken | false;
   close?: SToken;
}

interface AttDefinitionProps {
   name: SToken;
   nameSpace?: SToken;
   type?: SToken;
   typeSpace?: SToken;
   enumeration?: WordListPToken; // has its own post list space
   defaultType?: SToken;
   defaultTypeSpace?: SToken;
   openQuote?: SToken;
   value: AttributeValuePToken;
   closeQuote?: SToken;
   valueSpace?: SToken;
}

type RawAttListDeclaration = AttListDeclarationProps & {
   open: SToken;
};

type AttDefinition = Readonly<AttDefinitionProps>;

type ParsedAttCallback = (result: AttDefinitionProps) => void;

function isNotDeclarationStart(
   token: AttListDeclarationPToken | RawAttListDeclaration | DeclarationStart,
): token is AttListDeclarationPToken | RawAttListDeclaration {
   return (
      'elementName' in token ||
      'elementNameSpace' in token ||
      'attDefs' in token ||
      'close' in token ||
      'unexpanded' in token ||
      'extra' in token
   );
}

const ATTLIST_DECLARATION_PTOKEN = 'ATTLIST_DECLARATION_PTOKEN';

class AttListDeclarationPToken {
   public readonly type: typeof ATTLIST_DECLARATION_PTOKEN = ATTLIST_DECLARATION_PTOKEN;

   public readonly open: SToken;

   public readonly openSpace?: SToken;

   public readonly declType?: SToken;

   public readonly declTypeSpace?: SToken;

   public readonly elementName?: SToken;

   public readonly elementNameSpace?: SToken;

   public readonly attDefs: Array<AttDefinition>;

   public readonly unexpanded: UnexpandedMarkupDetails | undefined;

   public readonly extra: SToken | false | undefined;

   public readonly close?: SToken;

   constructor(
      base: AttListDeclarationPToken | RawAttListDeclaration | DeclarationStart,
      other: AttListDeclarationProps = {},
   ) {
      let attDefs: Array<AttDefinitionProps> = [];

      this.open = other.open || base.open;
      this.openSpace = 'openSpace' in other ? other.openSpace : base.openSpace;
      this.declType = 'declType' in other ? other.declType : base.declType;
      this.declTypeSpace = 'declTypeSpace' in other ? other.declTypeSpace : base.declTypeSpace;

      if (isNotDeclarationStart(base)) {
         this.elementName = base.elementName;
         this.elementNameSpace = base.elementNameSpace;
         attDefs = base.attDefs || [];
         this.unexpanded = base.unexpanded;
         this.extra = base.extra;
         this.close = base.close;
      }

      this.elementName = 'elementName' in other ? other.elementName : this.elementName;
      this.elementNameSpace =
         'elementNameSpace' in other ? other.elementNameSpace : this.elementNameSpace;
      attDefs = 'attDefs' in other ? other.attDefs || [] : attDefs;
      this.unexpanded = 'unexpanded' in other ? other.unexpanded : this.unexpanded;
      this.extra = 'extra' in other ? other.extra : this.extra;
      this.close = 'close' in other ? other.close : this.close;

      this.attDefs = [];

      for (const def of attDefs) {
         this.attDefs.push({
            name: def.name,
            nameSpace: def.nameSpace,
            type: def.type,
            typeSpace: def.typeSpace,
            enumeration: def.enumeration,
            defaultType: def.defaultType,
            defaultTypeSpace: def.defaultTypeSpace,
            openQuote: def.openQuote,
            value: def.value,
            closeQuote: def.closeQuote,
            valueSpace: def.valueSpace,
         });
      }
   }
}

function parseElementName(
   source: STokenSource,
   protoToken: AttListDeclarationProps,
   done: (result: AttListDeclarationProps) => void,
) {
   source.extractToObject('word', ['>', '%'], protoToken, 'elementName');
   source.extractNoParams('space', (elementNameSpace) => {
      protoToken.elementNameSpace = elementNameSpace;
      done(protoToken);
   });
}

function parseAttName(
   source: STokenSource,
   done: (result: AttDefinitionProps | undefined) => void,
) {
   source.extract('word', ['>', '%'], (name) => {
      if (!name) {
         done(undefined);
         return;
      }

      source.extractNoParams('space', (nameSpace) => {
         done({
            name,
            nameSpace,
            value: [],
         });
      });
   });
}

function parseAttType(source: STokenSource, attDef: AttDefinitionProps, done: ParsedAttCallback) {
   function populateList(list?: WordListPToken): void {
      attDef.enumeration = list;
      done(attDef);
   }

   source.extract('word', ['>', '%', '(', '#', '"', "'"], (attType) => {
      if (attType) {
         attDef.type = attType;
         source.extractToObjectNoParams('space', attDef, 'typeSpace');

         if (attType.str.toLocaleUpperCase() === 'NOTATION') {
            parseWordList(source, WordListType.NOTATION, populateList);
         } else {
            done(attDef);
         }
         return;
      }

      source.extractNoParams('peekChar', (charSToken) => {
         if (charSToken?.str === '(') {
            parseWordList(source, WordListType.ENUMERATION, populateList);
         } else {
            done(attDef);
         }
      });
   });
}

function parseAttDefaultType(
   source: STokenSource,
   attDef: AttDefinitionProps,
   done: ParsedAttCallback,
) {
   source.extractNoParams('peekChar', (charToken) => {
      if (charToken?.str === '#') {
         source.extractToObject('word', ['>', '%', '"', "'"], attDef, 'defaultType');
         source.extractNoParams('space', (defaultTypeSpace) => {
            attDef.defaultTypeSpace = defaultTypeSpace;
            done(attDef);
         });
      } else {
         done(attDef);
      }
   });
}

function parseAttValue(source: STokenSource, attDef: AttDefinitionProps, done: ParsedAttCallback) {
   literal.parse(
      source,
      {
         pToken: attDef,
         geRef: true,
         charRef: true,
      },
      () => {
         source.extractNoParams('space', (space) => {
            attDef.valueSpace = space;
            done(attDef);
         });
      },
   );
}

function parseAttDefs(
   source: STokenSource,
   protoToken: AttListDeclarationProps,
   done: (withAttrs: AttListDeclarationProps) => void,
) {
   parseUnexpanded(source, 'name', (unexpanded) => {
      if (unexpanded) {
         protoToken.unexpanded = unexpanded;
         done(protoToken);
         return;
      }

      parseAttName(source, (attDef) => {
         if (!attDef) {
            done(protoToken);
            return;
         }

         protoToken.attDefs?.push(attDef);

         parseUnexpanded(source, 'type', (unexpanded) => {
            if (unexpanded) {
               protoToken.unexpanded = unexpanded;
               done(protoToken);
               return;
            }

            parseAttType(source, attDef, (attWithType) => {
               parseUnexpanded(source, 'defaultType', (unexpanded) => {
                  if (unexpanded) {
                     protoToken.unexpanded = unexpanded;
                     done(protoToken);
                     return;
                  }

                  parseAttDefaultType(source, attWithType, (withDefault) => {
                     if (!withDefault.defaultType) {
                        parseAttValue(source, withDefault, () => {
                           parseAttDefs(source, protoToken, done);
                        });
                        return;
                     }

                     if (withDefault.defaultType.str.toLowerCase() !== '#fixed') {
                        parseAttDefs(source, protoToken, done);
                        return;
                     }

                     parseUnexpanded(source, 'value', (unexpanded) => {
                        if (unexpanded) {
                           protoToken.unexpanded = unexpanded;
                           done(protoToken);
                           return;
                        }

                        parseAttValue(source, withDefault, () => {
                           parseAttDefs(source, protoToken, done);
                        });
                     });
                  });
               });
            });
         });
      });
   });
}

function parseClose(
   source: STokenSource,
   declarationStart: DeclarationStart,
   protoToken: AttListDeclarationProps,
   deliverPToken: (token: AttListDeclarationPToken) => void,
) {
   source.extract('match', '>', (sToken) => {
      protoToken.close = sToken;
      deliverPToken(new AttListDeclarationPToken(declarationStart, protoToken));
   });
}

function resumeParseAttDefName(
   source: STokenSource,
   done: (result: Array<AttDefinitionProps>) => void,
): void {
   parseAttName(source, (attDef) => {
      if (!attDef) {
         done([]);
         return;
      }

      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      resumeParseAttDef(source, 'type', attDef, undefined, done);
   });
}

// For efficiency purposes, this may mutate the provided def (and of course it mutates the source :-)
function resumeParseAttDef(
   source: STokenSource,
   propName: string,
   def: AttDefinitionProps,
   extraSpace: SToken | undefined,
   done: (result: Array<AttDefinitionProps>) => void,
): void {
   switch (propName) {
      case 'type':
         parseAttType(source, def, (attWithType) => {
            attWithType.nameSpace = combineSTokens(attWithType.nameSpace, extraSpace);
            resumeParseAttDef(source, 'defaultType', attWithType, undefined, done);
         });
         break;
      case 'defaultType':
         parseAttDefaultType(source, def, (withDefault) => {
            withDefault.typeSpace = combineSTokens(withDefault.typeSpace, extraSpace);

            if (!withDefault.defaultType) {
               resumeParseAttDef(source, 'value', withDefault, undefined, done);
               return;
            }

            if (withDefault.defaultType.str.toLowerCase() !== '#fixed') {
               // space goes on typeSpace
               resumeParseAttDefName(source, (otherAttributes) => {
                  done([withDefault, ...otherAttributes]);
               });
               return;
            }

            resumeParseAttDef(source, 'value', withDefault, undefined, done);
         });
         break;
      case 'value':
         parseAttValue(source, def, (parsedAttDef) => {
            resumeParseAttDefName(source, (otherAttributes) => {
               parsedAttDef.defaultTypeSpace = combineSTokens(
                  parsedAttDef.defaultTypeSpace,
                  extraSpace,
               );
               done([parsedAttDef, ...otherAttributes]);
            });
         });
         break;
   }
}

function resumeParseAttListDeclaration(
   source: STokenSource,
   attListDeclaration: AttListDeclarationPToken,
   deliverPToken: (result: AttListDeclarationPToken) => void,
): void {
   source.extractNoParams('space', (preSpace) => {
      const propName = attListDeclaration.unexpanded?.propName || '';

      switch (propName) {
         case 'elementName':
            parseElementName(source, attListDeclaration, (withName) => {
               resumeParseAttDefName(source, (attDefs) => {
                  deliverPToken(
                     new AttListDeclarationPToken(attListDeclaration, {
                        ...withName,
                        declTypeSpace: combineSTokens(attListDeclaration.declTypeSpace, preSpace),
                        attDefs: [...attListDeclaration.attDefs, ...attDefs],
                     }),
                  );
               });
            });
            break;
         case 'name':
            resumeParseAttDefName(source, (attDefs) => {
               const props: AttListDeclarationProps = {};

               if (attListDeclaration.attDefs.length === 0) {
                  props.elementNameSpace = combineSTokens(
                     attListDeclaration.elementNameSpace,
                     preSpace,
                  );
                  props.attDefs = attDefs;
               } else {
                  const last = attListDeclaration.attDefs[attListDeclaration.attDefs.length - 1];
                  const butLast = [...attListDeclaration.attDefs];
                  butLast.pop();
                  const newLast = {
                     ...last,
                     valueSpace: combineSTokens(last.valueSpace, preSpace),
                  };

                  props.attDefs = [...butLast, newLast, ...attDefs];
               }

               deliverPToken(new AttListDeclarationPToken(attListDeclaration, props));
            });
            break;
         default:
            const trailingDef = attListDeclaration.attDefs[attListDeclaration.attDefs.length - 1];
            const preceding = [...attListDeclaration.attDefs];

            preceding.pop();

            resumeParseAttDef(source, propName, trailingDef, preSpace, (attDefs) => {
               deliverPToken(
                  new AttListDeclarationPToken(attListDeclaration, {
                     attDefs: [...preceding, ...attDefs],
                  }),
               );
            });
            break;
      }
   });
}

/**********************************************************************\
 parse() extracts the STokens for a attribute list declaration

 PARAM
   source: An STokenSource to read from
   declarationPToken: A map with the sTokens from parsing "<!ATTLIST S"
   deliverPToken: Callback to deliver the PTokens

 SYNTAX
   § 3.3.0
   [52] AttlistDecl    ::= '<!ATTLIST' S Name AttDef* S? '>'
   [53] AttDef         ::= S Name S AttType S DefaultDecl
   §3.3.1
   [54] AttType        ::= StringType | TokenizedType | EnumeratedType
   [55] StringType     ::= 'CDATA'
   [56] TokenizedType  ::= 'ID' | 'IDREF' | 'IDREFS' | 'ENTITY'
                           | 'ENTITIES' | 'NMTOKEN' | 'NMTOKENS'

   [57] EnumeratedType ::= NotationType | Enumeration
   [58] NotationType   ::= 'NOTATION' S
                           '(' S? Name (S? '|' S? Name)* S? ')'
   [59] Enumeration    ::= '(' S? Nmtoken (S? '|' S? Nmtoken)* S? ')'
   [60] DefaultDecl    ::= '#REQUIRED' | '#IMPLIED'
                           | (('#FIXED' S)? AttValue)

   Note: Codi tries to stick closely to the syntax names, but she has
   "subdivided" DefaultDecl into defaultType (all the # values) and
   `attValue`.
\**********************************************************************/

function parseAttListDeclaration(
   source: STokenSource,
   declarationStart: DeclarationStart,
   deliverPToken: (result: AttListDeclarationPToken) => void,
): void {
   const protoToken: AttListDeclarationProps = { attDefs: [] };

   parseUnexpanded(source, 'elementName', (unexpanded) => {
      if (unexpanded) {
         protoToken.unexpanded = unexpanded;
         parseClose(source, declarationStart, protoToken, deliverPToken);
         return;
      }

      parseElementName(source, protoToken, (withName) => {
         parseAttDefs(source, withName, (assembled) => {
            parseClose(source, declarationStart, assembled, deliverPToken);
         });
      });
   });
}

export {
   ATTLIST_DECLARATION_PTOKEN,
   AttListDeclarationPToken,
   parseAttListDeclaration,
   resumeParseAttListDeclaration,
};
