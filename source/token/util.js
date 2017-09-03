/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

function textOrBlank(lToken) {
   return lToken ? lToken.text : '';
}

function textOrUndef(lToken) {
   return lToken && lToken.text;
}

// Converts the parsing returned by declaraction.parse() into another type.
function toLocalParsing(type, declarationParsing) {
   return {
      type: type,
      openLToken: declarationParsing.openLToken,
      postOpenSpaceLToken: declarationParsing.postOpenSpaceLToken,
      declTypeLToken: declarationParsing.declTypeLToken,
      postDeclTypeSpaceLToken: declarationParsing.postDeclTypeSpaceLToken,
   };
}

function pIfNotBottom(results, value) {
   if (value !== undefined && value !== null) {
      results.push(value);
   }
}

module.exports = {
   textOrBlank,
   textOrUndef,
   toLocalParsing,
   pIfNotBottom,
};
