/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import {
   pushNonBottom,
   textOrBlank,
} from './common/util.js';
import * as externalId from './common/externalId.js';
import * as declaration from './declaration.js';
import * as misc from './common/misc.js';
import { Token as XmlToken } from './xmlToken.js';

const WFEID = WellFormedError.ID;
const DOCTYPE_START = 'DOCTYPE_START';

/**********************************************************************\
 The docTypeStart namespace contains the Token class, parser, validator
 and tokenizer for the start of a DOCTYPE token.

 The overall architecture of the system is that because the DOCTYPE
 declaration could be megabytes long (if there is a big internal
 subset) it makes some sense to treat the start of the DOCTYPE as one
 token and the end as a separate. This also makes "streaming" the
 internal subset easier since this does not need to worry about
 whether the end of the declaration is sound before the start of the
 internal subset can be delivered.

 Because of this, the items in this namespace merely process up to the
 "[" that opens the internal subset, or at least up to where that would
 be in the case that there is no internal subset.
\**********************************************************************/

class DocTypeStart extends XmlToken {

   constructor(name, externalLocation, hasInternalSubset, lTokens) {
      super(lTokens);

      this.name = name;
      this.externalLoc = externalLocation;
      this.hasInternalSubset = hasInternalSubset;
   }

}

/**********************************************************************\
 parse() extracts the pieces of a doctypedecl up to the start of
 an internal subset start.

 This assumes that the "<!DOCTYPE S" has already been parsed, and those
 lTokens are passed in through declarationStart.

 PARAM
 source: A LTokenSource to read from
 declarationStart: A hash with the lTokens from parsing "<!DOCTYPE S"
   presumably this was parsed by code in the declaration namespace.
 deliverParsed: Callback to deliver the parsed lTokens

 SYNTAX
   [28] doctypedecl ::= '<!DOCTYPE' S Name (S ExternalID)? S?
      ('[' intSubset ']' S?)? '>'
\**********************************************************************/

function parse(source, declarationParsing, deliverParsed) {
   const parsed = declaration.makeTypedDeclaration(DOCTYPE_START, declarationParsing);

   source.extractToObject('word', [ '[', '>' ], parsed, 'name'); // look for quotes?
   source.extractToObject('space', undefined, parsed, 'postNameSpace');

   externalId.parse(source, [ '[', '>' ], (externalId) => {
      parsed.externalId = externalId;

      source.extractToObject('space', undefined, parsed, 'postExternalIdSpace');

      source.extract('match', '[', (lToken) => {
         parsed.startInternalSubset = lToken;
         deliverParsed(parsed);
      });
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(parsed, ec, entityMetaData) {
   declaration.checkWellFormed(parsed, ec, entityMetaData);

   ec.setPos(parsed.name);
   ec.check(!parsed.name, WFEID.DOCTYPE_NO_NAME);
   misc.checkName(parsed.name, ec, entityMetaData, WFEID.DOCTYPE_NAME_INVALID);

   externalId.checkWellFormed(parsed.externalId, ec, entityMetaData);
}

/**********************************************************************\
 makeToken() converts a parsed into a token.
\**********************************************************************/

function makeToken(parsed) {
   return new DocTypeStart(textOrBlank(parsed.name),
      externalId.makeTokenCompatible(parsed.externalId),
      !!parsed.startInternalSubset,
      getLTokens(parsed));
}

function getLTokens(parsed) {
   const results = [];

   declaration.appendLTokens(results, parsed);

   pushNonBottom(results, parsed.name);
   pushNonBottom(results, parsed.postNameSpace);
   externalId.appendLTokens(results, parsed.externalId);
   pushNonBottom(results, parsed.postExternalIdSpace);

   pushNonBottom(results, parsed.postPublicSpace);
   pushNonBottom(results, parsed.startInternalSubset);

   return results;
}

export {
   DOCTYPE_START as TYPE,
   DocTypeStart as Token,
   parse,
   checkWellFormed,
   makeToken,
};
