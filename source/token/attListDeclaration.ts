/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from '../basic/index';
import { ErrorCollector, WellFormedError, XmlWarning } from '../error/index';
import { SToken, STokenSource } from '../sToken/index';
import entityReference from './entityReference';
import unassigned, { UnassignedArray } from './unassigned';

import declaration, { DeclarationPToken } from './bridge/declaration';
import literal, { LiteralValueXToken, LiteralValuePToken } from './common/literal';
import { parseWordList, newWordListFromUndefined, WordListType, WordListPToken } from './common/wordList';
import { AttributeValueXToken } from './common/attribute';
import misc from './common/misc.js';

const ATTLISTDECL_PTOKEN_TYPE = 'ATTLISTDECL_PTOKEN_TYPE';
const ATTLIST_XTOKEN_TYPE = 'ATTLIST_XTOKEN_TYPE';
const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;
const ATTR_TYPES = [ 'CDATA', 'ID', 'IDREF', 'IDREFS', 'ENTITY', 'ENTITIES', 'NMTOKEN', 'NMTOKENS', 'NOTATION' ];
const DEF_TYPES = [ '#REQUIRED', '#IMPLIED', '#FIXED' ];

type DeliverPToken = (pToken?: any) => void;

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

class AttListPToken extends DeclarationPToken {
   public readonly type: string = ATTLISTDECL_PTOKEN_TYPE;
   public elementName?: SToken;
   public postElementNameSpace?: SToken;
   public attDefs: Array<AttDefPToken>;
   public close?: SToken;
   public unassigned?: UnassignedArray;
   public extra?: UnassignedArray;
   public nextPropName?: string;

   constructor(basePToken?: DeclarationPToken|AttListPToken|Object) {
      /* istanbul ignore next */ // Istanbul is confused by transpilation
      super(ATTLISTDECL_PTOKEN_TYPE, basePToken);

      if (basePToken && 'attDefs' in basePToken) {
         this.attDefs = basePToken.attDefs;
      } else {
         this.attDefs = [];
      }
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

function parse(source: STokenSource, declarationPToken: DeclarationPToken, deliverPToken: DeliverPToken): void {
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
            source.extractToObjectNoParams('space', attDef, 'postDefaultTypeSpace');
         }

         parseAttValue(source, pToken, attDef, done);
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseAttValue(source: STokenSource, pToken: AttListPToken, attDef: AttDefPToken, done: DeliverPToken) {
   const callback = unassigned.makeCheckCallback(pToken, 'attValue', done, () => {
      literal.parse(source, {
         pToken: attDef,
         geRef: true,
      }, done);
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
 Recover from finding a parameter param entity ref in the declaration
\**********************************************************************/

function assignUnassigned(attLiPToken: AttListPToken) {
   if (!attLiPToken.unassigned || attLiPToken.unassigned.length === 0) {
      delete attLiPToken.unassigned;
      delete attLiPToken.nextPropName;
      return;
   }

   const unValues = attLiPToken.unassigned;
   const unexpandedRef = unValues.filter((item) => (item.type === 'reference'));

   if (unexpandedRef.length !== 0) {
      return;
   }

   if (attLiPToken.nextPropName === 'elementName') {
      unassigned.assignToProps(attLiPToken.unassigned, attLiPToken, attLiPToken.nextPropName, [
         { name: 'postDeclTypeSpace', type: 'space' },
         { name: 'elementName', type: 'word' },
         { name: 'postElementNameSpace', type: 'space' },
      ]);
      attLiPToken.nextPropName = 'name';
   }

   let lastLength = 0;

   while (lastLength !== unValues.length && unValues.length !== 0) {
      const couldNeedList = attLiPToken.nextPropName === 'name' || attLiPToken.nextPropName === 'type' || attLiPToken.nextPropName === 'defaultType';

      lastLength = unValues.length;
      let descriptors = [
         { name: 'name', type: 'word' },
         { name: 'postNameSpace', type: 'space' },
         { name: 'type', type: 'word', allowed: /^[^#(].*/i },
         { name: 'postTypeSpace', type: 'space' },
      ];

      if (attLiPToken.nextPropName === 'name') {
         // Working around TypeScript. this is wrong in some way.
         attLiPToken.attDefs.push({} as AttDefPToken);
         descriptors.unshift({ name: 'xtra', type: 'space' });
      }

      const nextDef = attLiPToken.attDefs[attLiPToken.attDefs.length -1];
      unassigned.assignToProps(attLiPToken.unassigned, nextDef, attLiPToken.nextPropName, descriptors);

      if (couldNeedList && (!nextDef.type || nextDef.type.str === '' || nextDef.type.str.toUpperCase() === 'NOTATION')) {
         const enumeration = nextDef.enumeration;
         const beforeLength = unValues.length;
         const type = (!nextDef.type || nextDef.type.str === '') ? WordListType.ENUMERATION : WordListType.NOTATION;

         if (enumeration) {
            nextDef.enumeration = enumeration.newWithUnassigned(unValues);
         } else {
            const newEnum = newWordListFromUndefined(type, unValues);

            // only add the namelist if we seem to have actually consumed any unassigned values.
            if (beforeLength !== unValues.length) {
               nextDef.enumeration = newEnum;
            }
         }         
      }

      const remainingDescriptors = [
         { name: 'defaultType', type: 'word', allowed: /^[#].*/i },
         { name: 'postDefaultTypeSpace', type: 'space' },
         { name: 'value', type: 'literal' },
         { name: 'postValueSpace', type: 'space' },
      ];

      if (attLiPToken.nextPropName === 'defaultType') {
         remainingDescriptors.unshift({ name: 'postTypeSpace', type: 'space' });
      }

      if (attLiPToken.nextPropName === 'name' || attLiPToken.nextPropName === 'type') {
         attLiPToken.nextPropName = 'defaultType';
      }

      unassigned.assignToProps(attLiPToken.unassigned, nextDef, attLiPToken.nextPropName, remainingDescriptors);

      attLiPToken.nextPropName = 'name';
   }

   adjustSpaces(attLiPToken);

   if (unValues.length !== 0) {
      attLiPToken.extra = attLiPToken.unassigned;
   }

   delete attLiPToken.nextPropName;
   delete attLiPToken.unassigned;
}

function adjustSpaces(attLiPToken: AttListPToken) {
   let prevDef: AttDefPToken = attLiPToken.attDefs[0];

   if (!prevDef) {
      return;
   }

   if (prevDef.xtra) {
      attLiPToken.postElementNameSpace = attLiPToken.postElementNameSpace ? 
         attLiPToken.postElementNameSpace.merge(prevDef.xtra) : prevDef.xtra;
      delete prevDef.xtra;
   }

   for (let index = 1; index < attLiPToken.attDefs.length; index++) {
      const current = attLiPToken.attDefs[index];

      if (current.xtra) {
         // need better definition here.
         if (prevDef.value) {
            prevDef.postValueSpace = prevDef.postValueSpace ?
               prevDef.postValueSpace.merge(current.xtra) :
               current.xtra;
         } else if (prevDef.defaultType) {
            prevDef.postDefaultTypeSpace = prevDef.postDefaultTypeSpace ?
               prevDef.postDefaultTypeSpace.merge(current.xtra) :
               current.xtra;
         } else if (prevDef.type) {
            prevDef.postTypeSpace = prevDef.postTypeSpace ?
               prevDef.postTypeSpace.merge(current.xtra) :
               current.xtra;
         } else {
            prevDef.postNameSpace = prevDef.postNameSpace ?
               prevDef.postNameSpace.merge(current.xtra) :
               current.xtra;
         }

         delete current.xtra;
      }  

   }
}

/**********************************************************************\
 checkWellFormed()
\**********************************************************************/

function checkWellFormed(pToken: AttListPToken | void, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   if (!pToken || pToken.unassigned) {
      return;
   }

   declaration.checkWellFormed(pToken, ec, entityMetaData);

   const elNameText = misc.textOrBlank(pToken.elementName);

   ec.setPos(pToken.elementName);
   ec.check(!pToken.elementName, WFEID.ATTLISTDECL_NO_ELEMENT_NAME);
   misc.checkName(pToken.elementName, ec, entityMetaData, WFEID.ATTLISTDECL_ELEMENT_NAME_INVALID);

   ec.setPos(pToken.postElementNameSpace);
   ec.check(!pToken.postElementNameSpace, WFEID.ATTLISTDECL_ELEMENT_NAME_NO_TRAILING_SPACE);

   if (pToken.attDefs.length < 1) {
      ec.setPos(undefined);
      ec.report(WFEID.ATTLISTDECL_NO_ATTRIBUTES, [ elNameText ]);
   }

   const attNames: {
      [name: string]: AttDefPToken,
   } = {};
   for (let index = 0; index < pToken.attDefs.length; index++) {
      const attDef = pToken.attDefs[index];
      const attName = misc.textOrBlank(attDef.name);

      ec.setPos(attDef.name);
      misc.checkName(attDef.name, ec, entityMetaData, WFEID.ATTLISTDECL_ATTR_NAME_INVALID);         
      misc.checkWellFormedNameRecommendation(attDef.name, ec, entityMetaData, 'ATTRIBUTE',
         WARN.ATTRLISTDECL_ATTR_NAME_XMLCOLON_RESERVED,
         WARN.ATTRLISTDECL_ATTR_NAME_XML_RESERVED);

      if (attNames[attName]) {
         ec.reportError(WARN.ATTLISTDECL_ATTR_NAME_DUPLICATE, XmlWarning, [ attName ]);
      }

      attNames[attName] = attDef;

      ec.setPos(attDef.postNameSpace);
      ec.check(!attDef.postNameSpace, WFEID.ATTLISTDECL_ATTR_NAME_NO_SPACE, [ attName, elNameText ]);

      ec.setPos(attDef.type);
      const attType = misc.textOrBlank(attDef.type);
      const upperAttType = attType.toLocaleUpperCase();
      const knownType = ATTR_TYPES.indexOf(upperAttType) !== -1;

      if (knownType) {
         ec.check(attType !== upperAttType, WFEID.ATTLISTDECL_ATTR_TYPE_INVALID, [ attName, elNameText, attType ]);
      }

      if (upperAttType === '') {
         if (!attDef.enumeration) {
            ec.report(WFEID.ATTLISTDECL_ATTR_NO_ENUMERATION, [ attName, elNameText ]);
         } else {
            attDef.enumeration.checkWellFormed(ec, entityMetaData);
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
               attDef.enumeration.checkWellFormed(ec, entityMetaData);
               ec.check(!attDef.enumeration.closeSpace, WFEID.ATTLISTDECL_ATTR_NO_NOTATION_SPACE, [ attName, elNameText ]);
            }
         }
      }

      // No default type is not an error
      const defType = misc.textOrBlank(attDef.defaultType);
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
      } else {
         ec.check(attDef.openQuote, WFEID.ATTLISTDECL_ATTR_EXTRA_VALUE, [ attName, elNameText ]);
      }

      literal.checkWellFormed(attDef, ec, entityMetaData, WFEID.NOUN_ATTRIBUTE);

      ec.setPos(pToken.close);
      ec.check(!pToken.close, WFEID.ATTLISTDECL_NO_CLOSE, [ elNameText ]);
   }
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
   const name = misc.textOrBlank(pToken.elementName);
   const attrs: Array<AttDefXToken> = [];

   for (let index = 0; index < pToken.attDefs.length; index++) {
      const attDef = pToken.attDefs[index];
      const xTokenAttrDef: AttDefXToken = {
         name: attDef.name.str,
         type: misc.textOrBlank(attDef.type),
         defaultType: misc.textOrBlank(attDef.defaultType),
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
   assignUnassigned,
   checkWellFormed,
   pTokenToXToken,
};

export default attListDecl;
export {
   AttListPToken,
   AttDefPToken,
   AttListXToken,
   AttDefXToken,
};