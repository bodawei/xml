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

module.exports = {
   parse,
};
