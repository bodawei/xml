/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from '../basic/index';
import { ErrorCollector, WellFormedError, XmlWarning } from '../error/index';
import { SToken, STokenSource } from '../sToken/index';
import entityReference from './entityReference.js';
import unassigned, { UnassignedArray } from './unassigned';

import declaration, { DeclarationPToken } from './bridge/declaration';
import literal from './common/literal.js';
import misc from './common/misc.js';

const ATTLISTDECL_PTOKEN_TYPE = 'ATTLISTDECL_PTOKEN_TYPE';
const ATTLIST_XTOKEN_TYPE = 'ATTLIST_XTOKEN_TYPE';
const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;
const ATTR_TYPES = [ 'CDATA', 'ID', 'IDREF', 'IDREFS', 'ENTITY', 'ENTITIES', 'NMTOKEN', 'NMTOKENS', 'NOTATION' ];
const DEF_TYPES = [ '#REQUIRED', '#IMPLIED', '#FIXED' ];

type DeliverPToken = (pToken?:AttListPToken) => void;

class AttDefPToken {
   public name: SToken;
   public postNameSpace?: SToken;
   public type?: SToken;
   public postTypeSpace?: SToken;
   public defaultType?: SToken;
   public postDefaultTypeSpace?: SToken;
   public openQuote?: SToken;
   public value?: Array<any>;
   public postValueSpace?: SToken;
   public closeQuote?: SToken;
   public postAttValueSpace?: SToken;
   public xtra?: SToken;
}

class AttListPToken extends DeclarationPToken {
   public readonly type: string;
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
      this.attDefs = this.attDefs || [];
   }
}

/**********************************************************************\
 parse() extracts the STokens for a attribute list declaration

 PARAM
   source: An STokenSource to read from
   declarationPToken: A map with the sTokens from parsing "<!ATTLIST S"
   deliverPToken: Callback to deliver the PTokens

 SYNTAX
   [52] AttlistDecl    ::= '<!ATTLIST' S Name AttDef* S? '>'
   [53] AttDef         ::= S Name S AttType S DefaultDecl
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
      source.extractToObject('space', pToken, 'postElementNameSpace');

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
         };
         pToken.attDefs.push(attDef);

         source.extractToObject('space', attDef, 'postNameSpace');

         parseAttType(source, pToken, attDef, () => {
            parseAttName(source, pToken, done);
         });
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseAttType(source: STokenSource, pToken: AttListPToken, attDef: AttDefPToken, done: DeliverPToken) {
   const callback = unassigned.makeCheckCallback(pToken, 'type', done, () => {
      source.extract('word', [ '>', '%', '(', '#', '"', '\'' ], (attType: SToken|void) => {
         if (attType) {
            attDef.type = attType;
            source.extractToObject('space', attDef, 'postTypeSpace');
         }

         parseDefaultType(source, pToken, attDef, done);
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseDefaultType(source: STokenSource, pToken: AttListPToken, attDef: AttDefPToken, done: DeliverPToken) {
   const callback = unassigned.makeCheckCallback(pToken, 'defaultType', done, () => {
      source.extract('peekChar', (charToken: SToken|void) => {
         if (charToken && charToken.str === '#') {
            source.extractToObject('word', [ '>', '%', '"', '\'' ], attDef, 'defaultType');
            source.extractToObject('space', attDef, 'postDefaultTypeSpace');
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
   const unValues = attLiPToken.unassigned || [];

   if (unValues.length === 0) {
      delete attLiPToken.unassigned;
      delete attLiPToken.nextPropName;
      return;
   }

   const unexpandedRef = unValues.filter((item) => (item.type === entityReference.PARAM_PTYPE));

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
      lastLength = unValues.length;
      let descriptors = [
         { name: 'name', type: 'word' },
         { name: 'postNameSpace', type: 'space' },
         { name: 'type', type: 'word', allowed: /^[^#].*/i },
         { name: 'postTypeSpace', type: 'space' },
         { name: 'defaultType', type: 'word', allowed: /^[#].*/i },
         { name: 'postDefaultTypeSpace', type: 'space' },
         { name: 'value', type: 'literal' },
         { name: 'postValueSpace', type: 'space' },
      ];

      if (attLiPToken.nextPropName === 'name') {
         // Working around TypeScript. this is wrong in some way.
         attLiPToken.attDefs.push({} as AttDefPToken);
         descriptors.unshift({ name: 'xtra', type: 'space' });
      }

      const nextDef = attLiPToken.attDefs[attLiPToken.attDefs.length -1];
      unassigned.assignToProps(attLiPToken.unassigned, nextDef, attLiPToken.nextPropName, descriptors);

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

function checkWellFormed(pToken: AttListPToken, ec: ErrorCollector, entityMetaData: EntityMetaData) {
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
      misc.checkWellFormedNameRecommendation(attDef.name, ec, entityMetaData, true,
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
      ec.check(!knownType, WFEID.ATTLISTDECL_ATTR_TYPE_UNKNOWN, [ attName, elNameText, attType ]);
      // @@@ don't forget to check the space after NOTATION

      if (knownType) {
         ec.check(attType !== upperAttType, WFEID.ATTLISTDECL_ATTR_TYPE_INVALID, [ attName, elNameText, attType ]);
      }

      ec.setPos(attDef.postTypeSpace);
      ec.check(!attDef.postTypeSpace, WFEID.ATTLISTDECL_ATTR_TYPE_NO_SPACE, [ attName, elNameText ]);

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

type XAttr = {
   name: string;
   type: string;
   defaultType: string;
   value?: Array<any>;
};

class AttListXToken {
      readonly type: string;
      public elementName?: string;
      public attDefs: Array<XAttr>;
      public defaultType?: string;
      public pToken: AttListPToken;

      constructor(elementName: string, attDefs: Array<XAttr>, pToken?: AttListPToken) {
         this.type = ATTLIST_XTOKEN_TYPE;
         this.elementName = elementName;
         this.attDefs = attDefs;
         this.pToken = pToken;
      }
}

function pTokenToXToken(pToken: AttListPToken): AttListXToken {
   const name = pToken.elementName ? pToken.elementName.str : '';
   const attrs: Array<XAttr> = [];

   for (let index = 0; index < pToken.attDefs.length; index++) {
      const attDef = pToken.attDefs[index];
      const xTokenAttrDef: XAttr = {
         name: attDef.name.str,
         type: misc.textOrBlank(attDef.type),
         defaultType: misc.textOrBlank(attDef.defaultType),
      };

      if (attDef.value) {
         xTokenAttrDef.value = literal.makeTokenCompatible(attDef);
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
   XAttr,
};