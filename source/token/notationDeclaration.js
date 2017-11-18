/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError, XmlWarning } from '../error';

import * as declaration from './bridge/declaration.js';
import * as externalId from './common/externalId.js';
import * as misc from './common/misc.js';
import * as base from './base.js';

const NOTATIONDECL = 'NOTATIONDECL';
const WARN = XmlWarning.ID;
const WFEID = WellFormedError.ID;

/**********************************************************************\
 The elementStart namespace contains the usual tools for processing
 an element start tag.
\**********************************************************************/

class NotationDeclaration extends base.XToken {

   constructor(name, externalId, sTokens) {
      super(sTokens);

      this.name = name;
      this.externalId = externalId;
   }

}

class NotationDeclarationPToken extends declaration.PToken {
   constructor(props) {
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

   source.extractToObject('word', [ '>' ], pToken, 'name');
   source.extractToObject('space', pToken, 'postNameSpace');

   externalId.parse(source, [ '>' ], (externalId) => {
      pToken.externalId = externalId;
      source.extractToObject('space', pToken, 'postExternalIdSpace');

      source.extract('match', '>', (sToken) => {
         pToken.close = sToken;
         deliverPToken(pToken);
      });
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken, ec, entityMetaData) {
   const nameText = misc.textOrBlank(pToken.name);

   declaration.checkWellFormed(pToken, ec, entityMetaData);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.NOTATIONDECL_NO_NAME);
   misc.checkName(pToken.name, ec, entityMetaData, WFEID.NOTATIONDECL_NAME_INVALID);
   misc.checkWellFormedNameRecommendation(pToken.name, ec, entityMetaData,
      WARN.NOTATIONDECL_NAME_XMLDASH_RESERVED,
      WARN.NOTATIONDECL_NAME_XML_RESERVED);

   ec.setPos(pToken.postNameSpace);
   ec.check(!pToken.postNameSpace, WFEID.NOTATIONDECL_NO_SPACE_AFTER_NAME, [ nameText ]);

   ec.setPos(undefined);
   ec.check(!pToken.externalId, WFEID.NOTATIONDECL_NO_EXTERNALID);
   externalId.checkWellFormed(pToken.externalId, ec, entityMetaData);

   ec.setPos(pToken.postExternalIdSpace);
   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.NOTATIONDECL_NO_CLOSE, [ nameText ]);
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
   checkWellFormed,
   pTokenToXToken,
};
