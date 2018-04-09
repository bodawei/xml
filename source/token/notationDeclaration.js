/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { WellFormedError, XmlWarning } from '../error';

import declaration from './bridge/declaration';
import externalId from './common/externalId.js';
import misc from './common/misc.js';
import base from './base';
import entityReference from './entityReference.js';
import unassigned from './unassigned';

const NOTATIONDECL = 'NOTATIONDECL';
const WARN = XmlWarning.ID;
const WFEID = WellFormedError.ID;

/**********************************************************************\
 The elementStart namespace contains the usual tools for processing
 an element start tag.
\**********************************************************************/

class NotationDeclaration extends base.XToken {

   constructor(name, externalId, pToken) {
      super(pToken);

      this.name = name;
      this.externalId = externalId;
   }

}

class NotationDeclarationPToken extends declaration.PToken {
   constructor(props) {
      /* istanbul ignore next */ // Istanbul is confused by transpilation
      super(NOTATIONDECL, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(this.name,
         this.postNameSpace);
      results.pushSTokens.apply(results, externalId.getSTokens(this.externalId)); // eslint-disable-line prefer-spread
      results.pushSTokens(this.postExternalIdSpace,
         this.close);

      return results;
   }
}

/**********************************************************************\
 parse() extracts a notation declaration.

 This assumes that the "<!NOTATION" has already been processed and has
 been passed as an argument to this

 PARAM
 source: A STokenSource to read from
 declarationPToken: The pToken value from declaration
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   [82] NotationDecl ::=
      '<!NOTATION' S Name S (ExternalID | PublicID) S? '>'
\**********************************************************************/

function parse(source, declarationPToken, deliverPToken) {
   const pToken = new NotationDeclarationPToken(declarationPToken);

   const callback = unassigned.makeCheckCallback(pToken, 'name', (thePToken) => {
      getClose(source, thePToken, undefined, deliverPToken);
   }, () => {
      source.extractToObject('word', [ '>' ], pToken, 'name');
      source.extractToObject('space', pToken, 'postNameSpace');

      externalId.parse(source, [ '>' ], (externalId) => {
         pToken.externalId = externalId;
         if (externalId && !externalId.unassigned) {
            source.extractToObject('space', pToken, 'postExternalIdSpace');
         }

         getClose(source, pToken, externalId, deliverPToken);
      });
   });

   unassigned.checkForPERef(source, callback);
}

function getClose(source, pToken, externalId, deliverPToken) {
   source.extract('match', '>', (sToken) => {
      pToken.close = sToken;
      if (externalId) {
         pToken.unassigned = externalId.unassigned;
      }

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

   const unexpandedRef = unValues.filter((item) => (item.type === entityReference.PARAM_PTYPE));

   if (unexpandedRef.length !== 0) {
      return;
   }

   if (notationPToken.nextPropName === 'name') {
      unassigned.assignToProps(notationPToken.unassigned, notationPToken, notationPToken.nextPropName, [
         { name: 'postDeclTypeSpace', type: 'space' },
         { name: 'name', type: 'word' },
         { name: 'postNameSpace', type: 'space' },
      ]);
   }

   notationPToken.externalId = notationPToken.externalId || {
      unassigned: notationPToken.unassigned,
   };
   externalId.assignUnassigned(notationPToken.externalId, notationPToken, 'postNameSpace');

   if (unValues.length !== 0) {
      notationPToken.extra = notationPToken.unassigned;
   }

   delete notationPToken.externalId.nextPropName;
   delete notationPToken.externalId.unassigned;
   delete notationPToken.externalId.extra;
   delete notationPToken.nextPropName;
   delete notationPToken.unassigned;
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken, ec, entityMetaData) {
   if (!pToken || pToken.unassigned) {
      return;
   }

   const nameText = misc.textOrBlank(pToken.name);

   declaration.checkWellFormed(pToken, ec, entityMetaData);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.NOTATIONDECL_NO_NAME);
   misc.checkName(pToken.name, ec, entityMetaData, WFEID.NOTATIONDECL_NAME_INVALID);
   misc.checkWellFormedNameRecommendation(pToken.name, ec, entityMetaData,
      WARN.NOTATIONDECL_NAME_XMLDASH_RESERVED,
      WARN.NOTATIONDECL_NAME_XML_RESERVED);

   ec.setPos(pToken.postNameSpace);
   ec.check(!pToken.postNameSpace, WFEID.NOTATIONDECL_NAME_NO_SPACE, [ nameText ]);

   ec.setPos(undefined);
   ec.check(!pToken.externalId, WFEID.NOTATIONDECL_NO_EXTERNALID);
   externalId.checkWellFormed(pToken.externalId, ec, entityMetaData);

   ec.setPos(pToken.postExternalIdSpace);
   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.NOTATIONDECL_NO_CLOSE, [ nameText ]);

   unassigned.checkExtra(pToken.extra, ec, WFEID.NOTATIONDECL_EXTRA_TEXT);
}

/**********************************************************************\
 pTokenToXToken() converts a pToken into a token.
\**********************************************************************/

function pTokenToXToken(pToken) {
   return new NotationDeclaration(misc.textOrBlank(pToken.name),
      externalId.makeEntityLocation(pToken.externalId), pToken);
}

export {
   NOTATIONDECL as PTYPE,
   NotationDeclaration as XToken,
   NotationDeclarationPToken as PToken,
   parse,
   assignUnassigned,
   checkWellFormed,
   pTokenToXToken,
};
