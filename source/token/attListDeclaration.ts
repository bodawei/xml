/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';
import unassigned from './unassigned.js';

import * as declaration from './bridge/declaration.js';
import misc from './common/misc.js';

const ATTLISTDECL_PTOKENTYPE = 'ATTLISTDECL_PTOKENTYPE';
const WFEID = WellFormedError.ID;

type SToken = {

};

type EntityMetaData = {

};
type ErrorCollector = {
   setPos(item:SToken);
   check(condition:any, code: string);
};

type UnassignedValue = {
   type: 'literal'|'word';
   [name: string]: any;
}

type STokenSource = {
   extract(type: string, deliverResult: (sToken: SToken) => void),
   extract(type: string, params: any, deliverResult: (sToken: SToken) => void),
   extractToObject(type: string, obj: Object, propName: string),
   extractToObject(type: string, params: any, obj: Object, propName: string),
};

type DeclPToken = {

};

type DeliverPToken = (pToken:Object) => void;

class AttListPToken {
   constructor(basePToken?: DeclPToken|AttListPToken) {
      Object.assign(this, basePToken);
   }

   elementName?: SToken;
   postElementNameSpace?: SToken;
   close?: SToken;
   unassigned?: Array<UnassignedValue>;
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
      done();
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

function checkWellFormed(pToken: AttListPToken, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   if (!pToken || pToken.unassigned) {
      return;
   }

   declaration.checkWellFormed(pToken, ec, entityMetaData);

   const enNameText = misc.textOrBlank(pToken.elementName);

   ec.setPos(pToken.elementName);
   ec.check(!pToken.elementName, WFEID.ATTLISTDECL_NO_ELEMENT_NAME);
   misc.checkName(pToken.elementName, ec, entityMetaData, WFEID.ATTLISTDECL_ELEMENT_NAME_INVALID);
}

const attListDecl = {
   PTYPE: ATTLISTDECL_PTOKENTYPE,
   PToken: AttListPToken,
   parse,
   checkWellFormed,
};

export default attListDecl;