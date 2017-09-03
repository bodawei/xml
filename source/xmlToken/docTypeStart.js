/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import tokens from './XmlToken.js';

const DOCTYPE_START = 'DOCTYPE_START';

class DocTypeStart extends tokens.XmlToken {

   constructor(name, externalLocation, chunks) {
      super(chunks);

      this.name = name;
      this.externalLoc = externalLocation;
   }

}

class DocTypeEnd extends tokens.XmlToken {

   constructor() {
      super(chunks);
   }

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

   source.extractToObject('word', [ '[', '>' ], parsed, 'nameChunk'), // look for quotes?
   source.extractToObject('space', undefined, parsed, 'postNameSpaceChunk'),

   // results.externalId = this._retrieveExternalId(cursor, [ '[', '>' ]);

   source.extractToObject('space', undefined, parsed, 'postExternalIdSpaceChunk'),

   source.extract('match', '[', (chunk) => {
      parsed.startInternalSubsetChunk = chunk;
      deliverParsed(parsed);
   });
}

function checkWellFormed(parsed, isDocEntity, version) {
}

function makeToken(parsed) {
}

module.exports = {
   TYPE: DOCTYPE_START,
   DocTypeStart,
   DocTypeEnd,
   parse,
   checkWellFormed,
   makeToken
};
