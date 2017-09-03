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
      open: declarationParsing.open,
      postOpenSpace: declarationParsing.postOpenSpace,
      declType: declarationParsing.declType,
      postDeclTypeSpace: declarationParsing.postDeclTypeSpace,
   };
}

function pushNonBottom(results, value) {
   if (value !== undefined && value !== null) {
      results.push(value);
   }
}

export {
   textOrBlank,
   textOrUndef,
   toLocalParsing,
   pushNonBottom,
};
