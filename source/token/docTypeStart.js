/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import util from './util.js';
import xmlToken from './xmlToken.js';
import externalId from './externalId.js';

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

class DocTypeStart extends xmlToken.Token {

   constructor(name, externalLocation, hasInternalSubset, lTokens) {
      super(lTokens);

      this.name = name;
      this.externalLoc = externalLocation;
      this.hasInternalSubset = hasInternalSubset;
   }

}

/**********************************************************************\
 parse() extracts the pieces of a documenttypedecl up to the start of
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
   const parsed = util.toLocalParsing(DOCTYPE_START, declarationParsing);

   source.extractToObject('word', [ '[', '>' ], parsed, 'nameLToken'); // look for quotes?
   source.extractToObject('space', undefined, parsed, 'postNameSpaceLToken');

   externalId.parse(source, [ '[', '>' ], (externalId) => {
      parsed.externalId = externalId;

      source.extractToObject('space', undefined, parsed, 'postExternalIdSpaceLToken');

      source.extract('match', '[', (lToken) => {
         parsed.startInternalSubsetLToken = lToken;
         deliverParsed(parsed);
      });
   });
}

function getChunks(parsed) {
   const results = [];

   util.pIfNotBottom(results, parsed.openLToken);
   util.pIfNotBottom(results, parsed.postOpenSpaceLToken);
   util.pIfNotBottom(results, parsed.declTypeLToken);
   util.pIfNotBottom(results, parsed.postDeclTypeSpaceLToken);

   util.pIfNotBottom(results, parsed.nameLToken);
   util.pIfNotBottom(results, parsed.postNameSpaceLToken);
   externalId.getChunks(results, parsed.externalId);
   util.pIfNotBottom(results, parsed.postExternalIdSpaceLToken);

   util.pIfNotBottom(results, parsed.postPublicSpaceLToken);
   util.pIfNotBottom(results, parsed.startInternalSubsetLToken);

   return results;
}

function checkWellFormed(parsed, ec, isDocEntity, version, revision) {
   ec.setPos(parsed.nameLToken);
   ec.check(!parsed.nameLToken, WFEID.DOCTYPE_NO_NAME);
   ec.checkName(parsed.nameLToken, WFEID.DOCTYPE_NAME_INVALID, version, revision);

   externalId.checkWellFormed(parsed.externalId, ec);

   return ec;
}

function makeToken(parsed) {
   return new DocTypeStart(util.textOrBlank(parsed.nameLToken),
      externalId.makeTokenCompatible(parsed.externalId),
      !!parsed.startInternalSubsetLToken,
      getChunks(parsed));
}

module.exports = {
   TYPE: DOCTYPE_START,
   Token: DocTypeStart,
   parse,
   checkWellFormed,
   makeToken,
};
