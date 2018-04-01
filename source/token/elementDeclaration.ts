/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../error/index';

import declaration from './bridge/declaration';
import nameList, { NameListPToken } from './common/nameList.js';
import misc from './common/misc.js';
import base from './base';
import unassigned from './unassigned.js';
import { SToken, STokenSource } from '../sToken/index';

const ELEMENTDECL = 'ELEMENTDECL';
const WARN = XmlWarning.ID;
const WFEID = WellFormedError.ID;

/**********************************************************************\
 The elementDeclaration namespace contains the usual tools for processing
 an element declarations.
\**********************************************************************/

class ElementDeclaration extends base.XToken {
   public name: string;

   constructor(name: string, contentSpecType: string, pToken: ElementDeclarationPToken) {
      super(pToken);

      this.name = name;
   }

}

class ElementDeclarationPToken extends declaration.PToken {
   public name?: SToken;
   public postNameSpace?: SToken;
   public contentSpec?: SToken;
   public postContentSpecSpace?: SToken;
   public children?: NameListPToken;
   public close?: SToken;
   public unassigned?: Array<any>;
   public extra?: Array<any>;

   constructor(props) {
      /* istanbul ignore next */ // Istanbul is confused by transpilation
      super(ELEMENTDECL, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(
         this.name,
         this.postNameSpace
      );

      return results;
   }
}

/**********************************************************************\
 parse() extracts an element declaration.

 This assumes that the "<!ELEMENT" has already been processed and has
 been passed as an argument to this.

 PARAM
   source: A STokenSource to read from
   declarationPToken: The pToken value from declaration
   deliverPToken: Callback to deliver the PToken

 SYNTAX
   [45] elementdecl ::= '<!ELEMENT' S Name S contentspec S? '>'
   [46] contentspec ::= 'EMPTY' | 'ANY' | Mixed | children
   Note that Mixed and children are handled by nameList
\**********************************************************************/

function parse(source: STokenSource, declarationPToken, deliverPToken) {
   const pToken = new ElementDeclarationPToken(declarationPToken);

   parseName(source, pToken, (resultToken: ElementDeclarationPToken) => {
      parseClose(source, resultToken, deliverPToken);
   });

}

function parseName(source: STokenSource, pToken: ElementDeclarationPToken, deliverPToken) {
   const callback = unassigned.makeCheckCallback(pToken, 'name', deliverPToken, () => {
      source.extractToObject('word', [ '>', '(' ], pToken, 'name');
      source.extractToObject('space', pToken, 'postNameSpace');
      parseContentSpec(source, pToken, deliverPToken);
   });

   unassigned.checkForPERef(source, callback);
}

function parseContentSpec(source: STokenSource, pToken: ElementDeclarationPToken, deliverPToken) {
   const callback = unassigned.makeCheckCallback(pToken, 'name', deliverPToken, () => {
      source.extract('peekChar', (charSToken) => {
         if (!charSToken) {
            deliverPToken(pToken);
            return;
         }

         if (charSToken.str !== '(') {
            source.extractToObject('word', [ '>' ], pToken, 'contentSpec');
            source.extractToObject('space', pToken, 'postContentSpecSpace');
            deliverPToken(pToken);
            return;
         }

         nameList.parse(source, 'ANY', (nameList: NameListPToken) => {
            pToken.children = nameList;
            // @@@ NEED TO DEAL WITH A PEREF HERE. Should nameList handle that? Or should externalId NOT handle that?
            deliverPToken(pToken);
         });
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseClose(source: STokenSource, pToken: ElementDeclarationPToken, deliverPToken) {
   source.extract('match', '>', (sToken) => {
      pToken.close = sToken;

      deliverPToken(pToken);
   });
}

/**********************************************************************\
 Recover from finding a parameter param entity ref in the declaration
\**********************************************************************/

function assignUnassigned(notationPToken) {
   const unValues = notationPToken.unassigned || [];

   if (unValues.length === 0) {
      delete notationPToken.unassigned;
      delete notationPToken.nextPropName;
      return;
   }

   // @@@ more here

}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken: ElementDeclarationPToken, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   if (!pToken || pToken.unassigned) {
      return;
   }

   const nameText = misc.textOrBlank(pToken.name);

   declaration.checkWellFormed(pToken, ec, entityMetaData);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.ELEMENTDECL_NO_NAME);
   misc.checkName(pToken.name, ec, entityMetaData, WFEID.ELEMENTDECL_NAME_INVALID);
   misc.checkWellFormedNameRecommendation(pToken.name, ec, entityMetaData,
      WARN.ELEMENTDECL_NAME_XMLDASH_RESERVED,
      WARN.ELEMENTDECL_NAME_XML_RESERVED);

   ec.setPos(pToken.postNameSpace);
   ec.check(!pToken.postNameSpace, WFEID.ELEMENTDECL_NAME_NO_SPACE, [ nameText ]);

   // @@@ more here

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.ELEMENTDECL_NO_CLOSE, [ nameText ]);

   unassigned.checkExtra(pToken.extra, ec, WFEID.ELEMENTDECL_EXTRA_TEXT);
}

/**********************************************************************\
 pTokenToXToken() converts a pToken into a token.
\**********************************************************************/

function pTokenToXToken(pToken: ElementDeclarationPToken) {
   let contentSpec = misc.textOrBlank(pToken.contentSpec);

   if (pToken.children) {
      contentSpec = 'CHILDREN';
   }

   return new ElementDeclaration(misc.textOrBlank(pToken.name),
      contentSpec, pToken);
}

const elementDeclaration = {
   PTYPE: ELEMENTDECL,
   XToken: ElementDeclaration,
   PToken: ElementDeclarationPToken,
   parse,
   assignUnassigned,
   checkWellFormed,
   pTokenToXToken,
};

export default elementDeclaration;