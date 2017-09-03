/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import util from './util.js';
import { Token as XmlToken } from './xmlToken.js';

const WFEID = WellFormedError.ID;
const DOCTYPE_END = 'DOCTYPE_END';

/**********************************************************************\
 docTypeEnd is the portion of a DOCTYPE declaration that comes after
 the internal subset (whether or not it is present).

 See docTypeStart for more details
\**********************************************************************/

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

   source.extractToObject('match', ']', parsed, 'closeInternalSubsetLToken');
   source.extractToObject('space', parsed, 'postCloseInternalSubsetSpaceLToken');

   source.extract('match', '>', (lToken) => {
      parsed.closeLToken = lToken;
      deliverParsed(parsed);
   });
}

function getChunks(parsed) {
   const results = [];

   util.pIfNotBottom(results, parsed.closeInternalSubsetLToken);
   util.pIfNotBottom(results, parsed.postCloseInternalSubsetSpaceLToken);
   util.pIfNotBottom(results, parsed.closeLToken);

   return results;
}

function checkWellFormed(parsed, startParsed, ec) {
   ec.setPos(startParsed.declTypeLToken);
   ec.setPos(startParsed.postDeclTypeSpaceLToken);
   ec.setPos(startParsed.nameLToken);
   ec.setPos(parsed.closeInternalSubsetLToken);

   if (!startParsed.startInternalSubsetLToken) {
      ec.check(parsed.closeInternalSubsetLToken, WFEID.DOCTYPE_INVALID_SUBSET_CLOSE);
   }

   ec.setPos(parsed.closeLToken);
   ec.check(!parsed.closeLToken, WFEID.DOCTYPE_NO_CLOSE);

   return ec;
}

function makeToken(parsed) {
   return new DocTypeEnd(getChunks(parsed));
}

module.exports = {
   TYPE: DOCTYPE_END,
   Token: DocTypeEnd,
   parse,
   checkWellFormed,
   makeToken,
};
