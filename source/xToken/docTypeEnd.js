/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import {
   pushNonBottom,
} from './common/util.js';
import { Token as XmlToken } from './xmlToken.js';

/**********************************************************************\
 docTypeEnd is the portion of a DOCTYPE declaration that comes after
 the internal subset (whether or not it is present).

 See docTypeStart for more details
\**********************************************************************/

const WFEID = WellFormedError.ID;
const DOCTYPE_END = 'DOCTYPE_END';

class DocTypeEnd extends XmlToken {
}

/**********************************************************************\
 parse() extracts ]> from the end of a DOCTYPE statement.

 This assumes that the next character in the source is a ].

 PARAM
 source: A LTokenSource to read from
 deliverParsed: Callback to deliver the parsed lTokens

 SYNTAX
   [28] doctypedecl ::= '<!DOCTYPE' S Name (S ExternalID)? S?
      ('[' intSubset ']' S?)? '>'
\**********************************************************************/

function parse(source, deliverParsed) {
   const parsed = {
      type: DOCTYPE_END,
   };

   source.extractToObject('match', ']', parsed, 'closeInternalSubset');
   source.extractToObject('space', parsed, 'postCloseInternalSubsetSpace');

   source.extract('match', '>', (lToken) => {
      parsed.close = lToken;
      deliverParsed(parsed);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(parsed, startParsed, ec) {
   ec.setPos(parsed.closeInternalSubset);

   if (!startParsed || !startParsed.startInternalSubset) {
      ec.check(parsed.closeInternalSubset, WFEID.DOCTYPE_INVALID_SUBSET_CLOSE);
   }

   // If there is no close, and no closeInternalSubset, this won't get a very good position.
   ec.setPos(parsed.close);
   ec.check(!parsed.close, WFEID.DOCTYPE_NO_CLOSE);

   return ec;
}

/**********************************************************************\
 makeToken() converts a parsed into a token.
\**********************************************************************/

function makeToken(parsed) {
   return new DocTypeEnd(getChunks(parsed));
}

function getChunks(parsed) {
   const results = [];

   pushNonBottom(results, parsed.closeInternalSubset);
   pushNonBottom(results, parsed.postCloseInternalSubsetSpace);
   pushNonBottom(results, parsed.close);

   return results;
}

export {
   DOCTYPE_END as TYPE,
   DocTypeEnd as Token,
   parse,
   checkWellFormed,
   makeToken,
};
