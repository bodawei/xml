/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

function textOrBlank(chunk) {
   return chunk ? chunk.text : '';
}

function textOrUndef(chunk) {
   return chunk && chunk.text;
}

function getQuotedLiteral(source, parsed, prefix, done) {
   source.extract('peekChar', undefined, (quoteChunk) => {
      if (!quoteChunk || (quoteChunk.text !== '"' && quoteChunk.text !== '\'')) {
         done(false);
         return;
      }

      source.extractToObject('char', undefined, parsed, prefix + 'OpenQuoteChunk');
      source.extractToObject('all', undefined, parsed, prefix + 'Chunk');

      source.extract('match', quoteChunk.text, (closeChunk) => {
         parsed[prefix + 'CloseQuoteChunk'] = closeChunk;
         done(textOrBlank(closeChunk) === quoteChunk.text);
      });
   });
}

module.exports = {
   textOrBlank,
   textOrUndef,
   getQuotedLiteral,
};
