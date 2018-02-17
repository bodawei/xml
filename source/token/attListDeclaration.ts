/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../error';
import { SToken, STokenSource } from '../sToken';
import entityReference from './entityReference.js';
import unassigned from './unassigned.js';

import * as declaration from './bridge/declaration.js';
import misc from './common/misc.js';

const ATTLISTDECL_PTOKEN_TYPE = 'ATTLISTDECL_PTOKEN_TYPE';
const ATTLIST_XTOKEN_TYPE = 'ATTLIST_XTOKEN_TYPE';
const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;

type DeliverPToken = (pToken:AttListPToken) => void;

type DeclPToken = {};
type UnassignedValue = object;

class AttDefPToken {
   public name: SToken;
}

class AttListPToken {
   public readonly type: string;
   public elementName?: SToken;
   public postElementNameSpace?: SToken;
   public attDefs: Array<AttDefPToken> = [];
   public close?: SToken;
   public unassigned?: Array<UnassignedValue>;
   public nextPropName?: string;

   constructor(basePToken?: DeclPToken|AttListPToken) {
      Object.assign(this, basePToken);
      this.type = ATTLISTDECL_PTOKEN_TYPE;
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
\**********************************************************************/

function parse(source: STokenSource, declarationPToken: DeclPToken, deliverPToken: DeliverPToken): void {
   const pToken = new AttListPToken(declarationPToken);

   parseElementName(source, pToken, () => {
      parseClose(source, pToken, deliverPToken);
   });
}

function parseElementName(source: STokenSource, pToken: AttListPToken, done: Function) {
   const callback = unassigned.makeCheckCallback(pToken, 'elementName', done, () => {
      source.extractToObject('word', [ '>', '%' ], pToken, 'elementName');
      source.extractToObject('space', pToken, 'postElementNameSpace');

      parseAttDef(source, pToken, done);
   });

   unassigned.checkForPERef(source, callback);
}

function parseAttDef(source: STokenSource, pToken: AttListPToken, done: Function) {
   const callback = unassigned.makeCheckCallback(pToken, 'attDef', done, () => {
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

         parseAttDef(source, pToken, done);
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
 Recover from finding a parameter param entity ref in the declaration
\**********************************************************************/

function assignUnassigned(atLiPToken) {
   const unValues = atLiPToken.unassigned || [];

   if (unValues.length === 0) {
      delete atLiPToken.unassigned;
      delete atLiPToken.nextPropName;
      return;
   }

   const unexpandedRef = unValues.filter((item) => (item.type === entityReference.PARAM_PTYPE));

   if (unexpandedRef.length !== 0) {
      return;
   }

   if (atLiPToken.nextPropName === 'elementName') {
      unassigned.assignToProps(atLiPToken.unassigned, atLiPToken, atLiPToken.nextPropName, [
         { name: 'postDeclTypeSpace', type: 'space' },
         { name: 'elementName', type: 'word' },
         { name: 'postElementNameSpace', type: 'space' },
      ]);
   }

   if (unValues.length !== 0) {
      atLiPToken.extra = atLiPToken.unassigned;
   }

   delete atLiPToken.nextPropName;
   delete atLiPToken.unassigned;
}

/**********************************************************************\
 checkWellFormed()
\**********************************************************************/

function checkWellFormed(pToken: AttListPToken, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   if (!pToken || pToken.unassigned) {
      return;
   }

   declaration.checkWellFormed(pToken, ec, entityMetaData);

   const enNameText = misc.textOrBlank(pToken.elementName);

   ec.setPos(pToken.elementName);
   ec.check(!pToken.elementName, WFEID.ATTLISTDECL_NO_ELEMENT_NAME);
   misc.checkName(pToken.elementName, ec, entityMetaData, WFEID.ATTLISTDECL_ELEMENT_NAME_INVALID);

   for (let index = 0; index < pToken.attDefs.length; index++) {
      const attDef = pToken.attDefs[index];

      ec.setPos(attDef.name);
      misc.checkName(attDef.name, ec, entityMetaData, WFEID.ATTLISTDECL_ATTR_NAME_INVALID);         
      misc.checkWellFormedNameRecommendation(attDef.name, ec, entityMetaData,
         WARN.ATTRLISTDECL_ATTR_NAME_XMLDASH_RESERVED,
         WARN.ATTRLISTDECL_ATTR_NAME_XML_RESERVED);
      }
}

/**********************************************************************\
 XToken
\**********************************************************************/

type XAttr = {
   name: string,
};

class AttListXToken {
      readonly type: string;
      public elementName: string;
      public attDefs: Array<XAttr>;
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

      attrs.push({
         name: attDef.name.str,
      });
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