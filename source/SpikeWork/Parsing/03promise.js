console.log('03');

class promises {

   // returns a promise
   async  parseGeneral(source, options) {
      const nextChar = await source.extractPromise('peekChar');

      if (!nextChar) {
         return;
      }

      switch (nextChar) {
         case '&':
//            return reference.parse(source);
            break;
         case '<':
            return this.markupParse(source);
         // must deal with close
         // default:
         //    return this._parseSpaceOrContent(source);
      }
   }

   async markupParse(source) {
      const markupStart = await source.extractPromise('markup');

      if (!markupStart) {
         return;
      }

      if (markupStart.text === '<?') {
         return this._parseProcessingInstruction(source, markupStart);
      }
   }

   async _parseProcessingInstruction(source, startChunk) {
      const results = {
         openChunk: startChunk,
         postOpenSpaceChunk: await source.extractPromise('space'),
         targetChunk: await source.extractPromise('word', [ '?>' ]),
         postTargetSpaceChunk: await source.extractPromise('space'),
      };
      //source.extractToObject('space', undefined, results, 'postOpenSpaceChunk');

      if (results.targetChunk && results.targetChunk.text.toLocaleLowerCase() === 'xml') {
         results.type = 'xmldecl';
         results.params = await this._getParams(source);
      } else {
         results.type = 'processinginstruction';
         results.instructionChunk = await source.extractPromise('all', [ '?>' ]);
      }

      results.closeChunk = await source.extractPromise('match', [ '?>' ]);
      return results;
   }

   async _getParams(source) {
      let nameChunk = await source.extractPromise('word', XMLDECL_NAME_TERMINATORS);
      const params = [];

      while (nameChunk) {
         const param = {
            postNameSpaceChunk: await source.extractPromise('space'),
            equalChunk: await source.extractPromise('match', '='),
            postEqualSpaceChunk: await source.extractPromise('space'),
         };
         let quoteChunk = await source.extractPromise('peekChar');
         const gotQuote = quoteChunk && (quoteChunk.text === '"' || quoteChunk.text === '\'');

         if (gotQuote) {
            param.openQuoteChunk = await source.extractPromise('char');
            param.value = await source.extractPromise('all', [ quoteChunk.text ]);
            param.closeQuoteChunk = await source.extractPromise('match', quoteChunk.text);
            param.trailingSpaceChunk = await source.extractPromise('space');
         }
         params.push(param);

         nameChunk = await source.extractPromise('word', XMLDECL_NAME_TERMINATORS);
      }

      return params;
   }

}


module.exports = promises;