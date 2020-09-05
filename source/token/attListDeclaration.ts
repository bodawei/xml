/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { strOrBlank, SToken, STokenSource } from 'sToken';
import unassigned, { UnassignedArray } from './common/unassigned';

import { DeclarationStart } from './bridge/declaration';
import literal, { LiteralValueXToken, LiteralValuePToken } from './common/literal';
import { parseWordList, WordListType, WordListPToken } from './common/wordList';
import { AttributeValueXToken } from './common/attribute';
import misc from './common/misc';

const ATTLISTDECL_PTOKEN_TYPE = 'ATTLISTDECL_PTOKEN_TYPE';
const ATTLIST_XTOKEN_TYPE = 'ATTLIST_XTOKEN_TYPE';
const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;
const ATTR_TYPES = [ 'CDATA', 'ID', 'IDREF', 'IDREFS', 'ENTITY', 'ENTITIES', 'NMTOKEN', 'NMTOKENS', 'NOTATION' ];
const DEF_TYPES = [ '#REQUIRED', '#IMPLIED', '#FIXED' ];

type DeliverPToken = (pToken?: any) => void;
type ProtoToken = {
   open: SToken;
   attDefs?: Array<AttDefPToken> | void;
   [other: string]: any;
};

type AttDefPToken = {
   name: SToken;
   postNameSpace?: SToken;
   type?: SToken;
   postTypeSpace?: SToken;
   enumeration?: WordListPToken, // has its own post list space
   defaultType?: SToken;
   postDefaultTypeSpace?: SToken;
   openQuote?: SToken;
   value: LiteralValuePToken;
   postValueSpace?: SToken;
   closeQuote?: SToken;
   postAttValueSpace?: SToken;
   xtra?: SToken;
}

class AttListPToken {
   public readonly type: typeof ATTLISTDECL_PTOKEN_TYPE = ATTLISTDECL_PTOKEN_TYPE;
   public open: SToken;
   public openSpace?: SToken;
   public declType?: SToken;
   public declTypeSpace?: SToken;
   public elementName?: SToken;
   public postElementNameSpace?: SToken;
   public attDefs: Array<AttDefPToken>;
   public close?: SToken;
   public peRefPlus: UnassignedArray;
   public unassigned?: UnassignedArray;
   public extra?: UnassignedArray;
   public nextPropName?: string;

   constructor(basePToken: ProtoToken|AttListPToken) {
      Object.assign(this, basePToken);

      if (basePToken.attDefs) {
         this.attDefs = basePToken.attDefs;
      } else {
         this.attDefs = [];
      }

      this.open = basePToken.open
      this.peRefPlus = basePToken.peRefPlus || [];
   }

   checkWellFormed(ec: ErrorCollector, confVer: ConformanceVersion) {
      checkWellFormed(this, ec, confVer);
   }
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
   attValue.
\**********************************************************************/

function parse(source: STokenSource, declarationPToken: DeclarationStart, deliverPToken: DeliverPToken): void {
   const pToken = new AttListPToken(declarationPToken);

   parseElementName(source, pToken, () => {
      parseClose(source, pToken, deliverPToken);
   });
}

function parseElementName(source: STokenSource, pToken: AttListPToken, done: DeliverPToken) {
   const callback = unassigned.makeCheckCallback(pToken, 'elementName', done, () => {
      source.extractToObject('word', [ '>', '%' ], pToken, 'elementName');
      source.extractToObjectNoParams('space', pToken, 'postElementNameSpace');

      parseAttName(source, pToken, done);
   });

   unassigned.checkForPERef(source, callback);
}

function parseAttName(source: STokenSource, pToken: AttListPToken, done: DeliverPToken) {
   const callback = unassigned.makeCheckCallback(pToken, 'name', done, () => {
      source.extract('word', [ '>', '%' ], (attrName: SToken|void) => {
         if (!attrName) {
            done();
            return;
         }

         const attDef = {
            name: attrName,
            value: []
         };
         pToken.attDefs.push(attDef);

         source.extractToObjectNoParams('space', attDef, 'postNameSpace');

         parseAttType(source, pToken, attDef, () => {
            parseAttName(source, pToken, done);
         });
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseAttType(source: STokenSource, pToken: AttListPToken, attDef: AttDefPToken, done: DeliverPToken) {
   function populateList(list?: WordListPToken): void {
      if (list) {
         attDef.enumeration = list;
      }

      parseDefaultType(source, pToken, attDef, done);
   }

   const callback = unassigned.makeCheckCallback(pToken, 'type', done, () => {
      source.extract('word', [ '>', '%', '(', '#', '"', '\'' ], (attType: SToken|void) => {
         if (attType) {
            attDef.type = attType;
            source.extractToObjectNoParams('space', attDef, 'postTypeSpace');

            if (attType.str.toLocaleUpperCase() === 'NOTATION') {
               parseWordList(source, WordListType.NOTATION, populateList);
               return;
            }

            parseDefaultType(source, pToken, attDef, done);
            return;
         }

         source.extractNoParams('peekChar', (charSToken) => {
            if (charSToken && charSToken.str === '(') {
               parseWordList(source, WordListType.ENUMERATION, populateList);
               return;
            }

            parseDefaultType(source, pToken, attDef, done);
         });
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseDefaultType(source: STokenSource, pToken: AttListPToken, attDef: AttDefPToken, done: DeliverPToken) {
   const callback = unassigned.makeCheckCallback(pToken, 'defaultType', done, () => {
      source.extractNoParams('peekChar', (charToken: SToken|void) => {
         if (charToken && charToken.str === '#') {
            source.extractToObject('word', [ '>', '%', '"', '\'' ], attDef, 'defaultType');
            source.extractNoParams('space', (sToken) => {
               attDef.postDefaultTypeSpace = sToken;

               if (attDef.defaultType && attDef.defaultType.str.toLowerCase() === '#fixed') {
                  parseAttValue(source, pToken, attDef, done);
               } else {
                  done(pToken);
               }
            });
         } else {
            parseAttValue(source, pToken, attDef, done);
         }
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseAttValue(source: STokenSource, pToken: AttListPToken, attDef: AttDefPToken, done: DeliverPToken) {
   const callback = unassigned.makeCheckCallback(pToken, 'attValue', done, () => {
      literal.parse(source, {
         pToken: attDef,
         geRef: true,
         charRef: true,
      }, (pToken) => {
         source.extractNoParams('space', (space) => {
            if (space) {
               attDef.postValueSpace = space;
            }
            done(pToken);
         });
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseClose(source: STokenSource, pToken: AttListPToken, deliverPToken: Function) {
   source.extract('match', '>', (sToken) => {
      pToken.close = sToken;
      deliverPToken(pToken);
   });
}

/**********************************************************************\
 checkWellFormed()
\**********************************************************************/

function checkWellFormed(pToken: AttListPToken | void, ec: ErrorCollector, confVer: ConformanceVersion) {
   if (!pToken || pToken.unassigned) {
      return;
   }

   // When you rework this, make sure you're doing all the text checking correctly.

   // declaration.checkWellFormed(pToken, ec, confVer);
   const declType = strOrBlank(pToken.declType);

   ec.setPos(pToken.declType);
   ec.check(declType !== 'ATTLIST', WFEID.ATTLISTDECL_DECLTYPE_INVALID, [ declType ]);

   const elNameText = strOrBlank(pToken.elementName);

   ec.setPos(pToken.elementName);
   ec.check(!pToken.elementName, WFEID.ATTLISTDECL_NO_ELEMENT_NAME);
   misc.checkName(pToken.elementName, ec, confVer, WFEID.ATTLISTDECL_ELEMENT_NAME_INVALID);

   ec.setPos(pToken.postElementNameSpace);
   if (pToken.attDefs.length > 0) {
      ec.check(!pToken.postElementNameSpace, WFEID.ATTLISTDECL_ELEMENT_NAME_NO_TRAILING_SPACE);
   }

   const attNames: {
      [name: string]: AttDefPToken,
   } = {};
   for (let index = 0; index < pToken.attDefs.length; index++) {
      const attDef = pToken.attDefs[index];
      const attName = strOrBlank(attDef.name);

      ec.setPos(attDef.name);
      misc.checkName(attDef.name, ec, confVer, WFEID.ATTLISTDECL_ATTR_NAME_INVALID);
      misc.checkWellFormedNameRecommendation(attDef.name, ec, confVer, 'ATTRIBUTE',
         WARN.ATTRLISTDECL_ATTR_NAME_XMLCOLON_RESERVED,
         WARN.ATTRLISTDECL_ATTR_NAME_XML_RESERVED);

      if (attNames[attName]) {
         ec.reportError(WARN.ATTLISTDECL_ATTR_NAME_DUPLICATE, XmlWarning, [ attName ]);
      }

      attNames[attName] = attDef;

      ec.setPos(attDef.postNameSpace);
      ec.check(!attDef.postNameSpace, WFEID.ATTLISTDECL_ATTR_NAME_NO_SPACE, [ attName, elNameText ]);

      ec.setPos(attDef.type);
      const attType = strOrBlank(attDef.type);
      const upperAttType = attType.toLocaleUpperCase();
      const knownType = ATTR_TYPES.indexOf(upperAttType) !== -1;

      if (knownType) {
         ec.check(attType !== upperAttType, WFEID.ATTLISTDECL_ATTR_TYPE_INVALID, [ attName, elNameText, attType ]);
      }

      if (upperAttType === '') {
         if (!attDef.enumeration) {
            ec.report(WFEID.ATTLISTDECL_ATTR_NO_ATTTYPE, [ attName, elNameText ]);
         } else {
            attDef.enumeration.checkWellFormed(ec, confVer);
            ec.check(!attDef.enumeration.closeSpace, WFEID.ATTLISTDECL_ATTR_NO_ENUMERATION_SPACE, [ attName, elNameText ]);
         }
      } else {
         ec.check(!knownType, WFEID.ATTLISTDECL_ATTR_TYPE_UNKNOWN, [ attName, elNameText, attType ]);
         ec.setPos(attDef.postTypeSpace);
         ec.check(!attDef.postTypeSpace, WFEID.ATTLISTDECL_ATTR_TYPE_NO_SPACE, [ attName, elNameText ]);

         if (upperAttType === 'NOTATION') {
            if (!attDef.enumeration) {
               ec.report(WFEID.ATTLISTDECL_ATTR_NO_NOTATION, [ attName, elNameText ]);
            } else {
               attDef.enumeration.checkWellFormed(ec, confVer);
               ec.check(!attDef.enumeration.closeSpace, WFEID.ATTLISTDECL_ATTR_NO_NOTATION_SPACE, [ attName, elNameText ]);
            }
         }
      }

      // No default type is not an error
      const defType = strOrBlank(attDef.defaultType);
      const upperDefType = defType.toLocaleUpperCase();

      if (attDef.defaultType) {
         ec.setPos(attDef.defaultType);
         const knownDefType = DEF_TYPES.indexOf(upperDefType) !== -1;

         ec.check(!knownDefType, WFEID.ATTLISTDECL_ATTR_DEFAULT_UNKNOWN, [ attName, elNameText, defType ]);

         if (knownDefType) {
            ec.check(defType !== upperDefType, WFEID.ATTLISTDECL_ATTR_DEFAULT_INVALID, [ attName, elNameText, defType ]);
         }

         ec.setPos(attDef.postDefaultTypeSpace);
         if (upperDefType === '#FIXED') {
            ec.check(!attDef.postDefaultTypeSpace, WFEID.ATTLISTDECL_ATTR_FIXED_NO_SPACE, [ attName, elNameText ]);
         }
      }

      ec.setPos(attDef.openQuote);

      if (upperDefType === '' || upperDefType === '#FIXED') {
         ec.check(!attDef.openQuote, upperDefType === ''
            ? WFEID.ATTLISTDECL_ATTR_NO_VALUE
            : WFEID.ATTLISTDECL_ATTR_FIXED_NO_VALUE, [ attName, elNameText ]);
       // @@@ need to check and complain if any entity refs are to external entities (general or parameter)
       literal.checkWellFormed(attDef, ec, confVer, WFEID.NOUN_ATTRIBUTE);
      } else {
         // wtf?
         ec.check(attDef.openQuote, WFEID.ATTLISTDECL_ATTR_EXTRA_VALUE, [ attName, elNameText ]);
      }
   }

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.ATTLISTDECL_NO_CLOSE, [ elNameText ]);

   unassigned.checkExtra(pToken.extra, ec, WFEID.ATTLISTDECL_EXTRA_TEXT);
}

/**********************************************************************\
 XToken
\**********************************************************************/

type AttDefXToken = {
   name: string;
   type: string;
   enumeration?: Array<string>;
   defaultType: string;
   value: AttributeValueXToken;
};

class AttListXToken {
      public readonly type: string;
      public elementName: string;
      public attDefs: Array<AttDefXToken>;
      public defaultType?: string;
      public pToken?: AttListPToken;

      constructor(elementName: string, attDefs: Array<AttDefXToken>, pToken?: AttListPToken) {
         this.type = ATTLIST_XTOKEN_TYPE;
         this.elementName = elementName;
         this.attDefs = attDefs;
         this.pToken = pToken;
      }
}

function pTokenToXToken(pToken: AttListPToken): AttListXToken {
   const name = strOrBlank(pToken.elementName);
   const attrs: Array<AttDefXToken> = [];

   for (let index = 0; index < pToken.attDefs.length; index++) {
      const attDef = pToken.attDefs[index];
      const xTokenAttrDef: AttDefXToken = {
         name: attDef.name.str,
         type: strOrBlank(attDef.type),
         defaultType: strOrBlank(attDef.defaultType),
         value: [],
      };

      if (attDef.enumeration) {
         if (xTokenAttrDef.type === '') {
            xTokenAttrDef.type = 'ENUMERATION';
         }

         xTokenAttrDef.enumeration = attDef.enumeration.toXToken();
      }

      const result = literal.makeTokenCompatible(attDef)
      if (result) {
         xTokenAttrDef.value = result;
      }

      attrs.push(xTokenAttrDef);
   }

   return new AttListXToken(name, attrs, pToken);
}

/**********************************************************************\
 Public Interface
\**********************************************************************/

const attListDecl = {
   PTYPE: ATTLISTDECL_PTOKEN_TYPE,
   PToken: AttListPToken,
   XTYPE: ATTLIST_XTOKEN_TYPE,
   XToken: AttListXToken,

   parse,
   checkWellFormed,
   pTokenToXToken,
};

const parseAttListDeclaration = parse;

export default attListDecl;
export {
   ATTLISTDECL_PTOKEN_TYPE,

   AttListPToken,
   AttDefPToken,
   AttListXToken,
   AttDefXToken,

   parseAttListDeclaration,
};