function parse(source, options, deliverParsed) {
   const parsed = {};

   source.extract('char', (chunk) => {
      parsed.openQuoteChunk = chunk;

      source.extract('all', [ chunk.text ], (chunk) => {
         parsed.valueChunk = chunk;

         source.extract('char', (chunk) => {
            parsed.closeQuoteChunk = chunk;

            deliverParsed(parsed);
         });
      });
   });
}

module.exports = {
   parse,
};
