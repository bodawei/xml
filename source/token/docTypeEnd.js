/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import xmlToken from './xmlToken.js';

const WFEID = WellFormedError.ID;
const DOCTYPE_END = 'DOCTYPE_END';

class DocTypeEnd extends xmlToken.Token {
}

/**********************************************************************\
 parse() extracts ]> from the end of a DOCTYPE statement.

 This assumes that the next character is a ].

 PARAM
 source: A ChunkSource to read from
 deliverParsed: Callback to deliver the parsed chunks

 SYNTAX
   [28] doctypedecl ::= '<!DOCTYPE' S
      Name (S ExternalID)? S? ('[' intSubset ']' S?)? '>'
\**********************************************************************/

function parse(source, deliverParsed) {
   const parsed = {
      type: DOCTYPE_END,
   };

   source.extractToObject('match', ']', parsed, 'closeInternalSubsetChunk');
   source.extractToObject('space', parsed, 'postCloseInternalSubsetSpaceChunk');

   source.extract('match', '>', (chunk) => {
      parsed.closeChunk = chunk;
      deliverParsed(parsed);
   });
}

function checkWellFormed(parsed, startParsed, ec) {
   ec.setPos(startParsed.declTypeChunk);
   ec.setPos(startParsed.postDeclTypeSpaceChunk);
   ec.setPos(startParsed.nameChunk);
   ec.setPos(parsed.closeInternalSubsetChunk);

   if (!startParsed.startInternalSubsetChunk) {
      ec.check(parsed.closeInternalSubsetChunk, WFEID.DOCTYPE_INVALID_SUBSET_CLOSE);
   }

   ec.setPos(parsed.closeChunk);
   ec.check(!parsed.closeChunk, WFEID.DOCTYPE_NO_CLOSE);

   return ec;
}

function makeToken() {
   return new DocTypeEnd([]);
}

module.exports = {
   TYPE: DOCTYPE_END,
   Token: DocTypeEnd,
   parse,
   checkWellFormed,
   makeToken,
};
