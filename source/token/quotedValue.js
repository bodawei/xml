import util from './util.js';

function parse(source, options, deliverParsed) {
   const parsed = {};

   source.extract('char', (lToken) => {
      parsed.openQuoteLToken = lToken;

      source.extract('all', [ lToken.text ], (lToken) => {
         parsed.valueLToken = lToken;

         source.extract('char', (lToken) => {
            parsed.closeQuoteLToken = lToken;

            deliverParsed(parsed);
         });
      });
   });
}

function getChunks(results, parsed) {
   if (!parsed) {
      return;
   }
   util.pIfNotBottom(results, parsed.openQuoteLToken);
   util.pIfNotBottom(results, parsed.valueLToken);
   util.pIfNotBottom(results, parsed.closeQuoteLToken);
}

module.exports = {
   parse,
   getChunks,
};
