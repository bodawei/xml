/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

function textOrBlank(chunk) {
   return chunk ? chunk.text : '';
}

function textOrUndef(chunk) {
   return chunk && chunk.text;
}

// Converts the parsing returned by declaraction.parse() into another type.
function toLocalParsing(type, declarationParsing) {
   return {
      type: type,
      openChunk: declarationParsing.openChunk,
      postOpenSpaceChunk: declarationParsing.postOpenSpaceChunk,
      declTypeChunk: declarationParsing.declTypeChunk,
      postDeclTypeSpaceChunk: declarationParsing.postDeclTypeSpaceChunk,
   };
}

module.exports = {
   textOrBlank,
   textOrUndef,
   toLocalParsing,
};
