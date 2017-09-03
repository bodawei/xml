/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import error from '../error';

import token from './XmlToken.js';

const basic = require('../basic');

const WFEID = error.WellFormedError.ID;
const DOCTYPE_START = 'DOCTYPE_START';

class DocTypeStart extends token.XmlToken {

   constructor(name, externalLocation, chunks) {
      super(chunks);

      this.name = name;
      this.externalLoc = externalLocation;
   }

}

function textOrBlank(chunk) {
   return chunk ? chunk.text : '';
}

/**********************************************************************\
 parse() extracts the pieces of a documenttypedecl up to the start of
 an internal subset start.

 This assumes that the "<!DOCTYPE S" has already been parsed, and those
 chunks are passed in through declarationStart.

 PARAM
 source: A ChunkSource to read from
 declarationStart: A hash with the chunks from parsing "<!DOCTYPE S"
 deliverParsed: Callback to deliver the parsed chunks

 SYNTAX
   [28] doctypedecl ::= '<!DOCTYPE' S
      Name (S ExternalID)? S? ('[' intSubset ']' S?)? '>'
\**********************************************************************/

function parse(source, declarationStart, deliverParsed) {
   const parsed = {
      type: DOCTYPE_START,
      openChunk: declarationStart.openChunk,
      postOpenSpaceChunk: declarationStart.postOpenSpaceChunk,
      declTypeChunk: declarationStart.declTypeChunk,
      postDeclTypeSpaceChunk: declarationStart.postDeclTypeSpaceChunk,
   };

   source.extractToObject('word', [ '[', '>' ], parsed, 'nameChunk'); // look for quotes?
   source.extractToObject('space', undefined, parsed, 'postNameSpaceChunk');

   source.extractToObject('space', undefined, parsed, 'postExternalIdSpaceChunk');

   source.extract('match', '[', (chunk) => {
      parsed.startInternalSubsetChunk = chunk;
      deliverParsed(parsed);
   });
}

function checkWellFormed(parsed, isDocEntity, version, revision) {
   const ec = new basic.ErrorCollector(parsed.openChunk, error.WellFormedError);

   ec.setPos(parsed.nameChunk);
   ec.check(!parsed.nameChunk, WFEID.DOCTYPE_NO_NAME);
   ec.checkName(parsed.nameChunk, WFEID.DOCTYPE_NAME_INVALID, version, revision);

   return ec;
}

function makeToken(parsed) {
   return new DocTypeStart(textOrBlank(parsed.nameChunk), undefined, []);
}

module.exports = {
   TYPE: DOCTYPE_START,
   DocTypeStart,
   parse,
   checkWellFormed,
   makeToken,
};
