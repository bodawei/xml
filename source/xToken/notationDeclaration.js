/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError, XmlWarning } from '../error';

import {
   pushNonBottom,
   textOrBlank,
   toLocalParsing,
} from './common/util.js';
import * as declaration from './declaration.js';
import * as externalId from './common/externalId.js';
import * as misc from './common/misc.js';
import { Token as XmlToken } from './xmlToken.js';

const NOTATIONDECL = 'NOTATIONDECL';
const WARN = XmlWarning.ID;
const WFEID = WellFormedError.ID;

/**********************************************************************\
 The elementStart namespace contains the usual tools for processing
 an element start tag.
\**********************************************************************/

class NotationDeclaration extends XmlToken {

   constructor(name, externalId, lTokens) {
      super(lTokens);

      this.name = name;
      this.externalId = externalId;
   }

}

/**********************************************************************\
 parse() extracts a notation declaration.

 This assumes that the "<!NOTATION" has already been parsed and has
 been passed as an argument to this

 PARAM
 source: A LTokenSource to read from
 declarationParsing: The parsed value from declaration
 deliverParsed: Callback to deliver the parsed LTokens

 SYNTAX
   [82] NotationDecl ::=
      '<!NOTATION' S Name S (ExternalID | PublicID) S? '>'
\**********************************************************************/

function parse(source, declarationParsing, deliverParsed) {
   const parsed = toLocalParsing(NOTATIONDECL, declarationParsing);

   source.extractToObject('word', [ '>' ], parsed, 'name');
   source.extractToObject('space', parsed, 'postNameSpace');

   externalId.parse(source, [ '>' ], (externalId) => {
      parsed.externalId = externalId;
      source.extractToObject('space', parsed, 'postExternalIdSpace');

      source.extract('match', '>', (lToken) => {
         parsed.close = lToken;
         deliverParsed(parsed);
      });
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(parsed, ec, entityMetaData) {
   const nameText = textOrBlank(parsed.name);

   declaration.checkWellFormed(parsed, ec, entityMetaData);

   ec.setPos(parsed.name);
   ec.check(!parsed.name, WFEID.NOTATIONDECL_NO_NAME);
   ec.checkName(parsed.name, WFEID.NOTATIONDECL_NAME_INVALID, entityMetaData);
   misc.checkWellFormedNameRecommendation(parsed.name, ec, entityMetaData,
      WARN.NOTATIONDECL_NAME_XMLDASH_RESERVED,
      WARN.NOTATIONDECL_NAME_XML_RESERVED);

   ec.setPos(parsed.postNameSpace);
   ec.check(!parsed.postNameSpace, WFEID.NOTATIONDECL_NO_SPACE_AFTER_NAME, [ nameText ]);

   ec.setPos(undefined);
   ec.check(!parsed.externalId, WFEID.NOTATIONDECL_NO_EXTERNALID);
   externalId.checkWellFormed(parsed.externalId, ec, entityMetaData);

   ec.setPos(parsed.postExternalIdSpace);
   ec.setPos(parsed.close);
   ec.check(!parsed.close, WFEID.NOTATIONDECL_NO_CLOSE, [ nameText ]);
}

/**********************************************************************\
 makeToken() converts a parsed into a token.
\**********************************************************************/

function makeToken(parsed) {
   return new NotationDeclaration(textOrBlank(parsed.name),
      externalId.makeTokenCompatible(parsed.externalId), getLTokens(parsed));
}

function getLTokens(parsed) {
   const results = [];

   declaration.appendLTokens(results, parsed);

   pushNonBottom(results, parsed.name);
   pushNonBottom(results, parsed.postNameSpace);

   externalId.appendLTokens(results, parsed.externalId);

   pushNonBottom(results, parsed.postExternalIdSpace);
   pushNonBottom(results, parsed.close);

   return results;
}

export {
   NOTATIONDECL as TYPE,
   NotationDeclaration as Token,
   parse,
   checkWellFormed,
   makeToken,
};
