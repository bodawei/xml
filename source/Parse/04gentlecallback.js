const XMLDECL_NAME_TERMINATORS = [ '=', '?>' ];

class GentleCallback {

   parseGeneral(source, deliverParse) {
      const nextChar = source.extract('peekChar', (chunk) => {
         if (!chunk) {
            deliverParse(null);
            return;
         }

         switch (chunk.text) {
            case '&':
   //            return reference.parse(source);
               break;
            case '<':
               return this._markupParse(source, deliverParse);
            // must deal with close
            // default:
            //    return this._parseSpaceOrContent(source);
         }
      });
   }

   _markupParse(source, deliverParse) {
      source.extract('markup', (markupStartChunk) => {
         if (!markupStartChunk) {
            return;
         }

         if (markupStartChunk.text === '<?') {
            return this.parseProcessingInstruction(source, markupStartChunk, deliverParse);
         }
      });
   }

   parseProcessingInstruction(source, startChunk, deliverParse) {
      const results = {
         openChunk: startChunk
      };

      source.extractToObject('space', undefined, results, 'postOpenSpaceChunk'),
      source.extractToObject('word', [ '?>' ], results, 'targetChunk'),

      source.extract('space', (chunk) => {
         results.postTargetSpaceChunk = chunk;

         if (results.targetChunk && results.targetChunk.text.toLocaleLowerCase() === 'xml') {
            results.type = 'xmldecl';
            this._getParams(source, (params) => {
               results.params = params;
               source.extract('match', '?>', (chunk) => {
                  results.closeChunk = chunk;
                  deliverParse(results);
               });
            });
         } else {
            results.type = 'processinginstruction';
            source.extractToObject('all', [ '?>' ], results, 'instructionChunk'),
            source.extract('match', '?>', (chunk) => {
               results.closeChunk = chunk;
               deliverParse(results);
            });
         }
      });         
   }

   _getParams(source, deliverResults) {
      const params = [];
      source.extract('word', XMLDECL_NAME_TERMINATORS, (chunk) => {
         this._addParam(source, params, chunk, deliverResults);
      });
   }

   _addParam(source, params, nameChunk, deliverResults) {
      if (!nameChunk) {
         deliverResults(params);
         return;
      }
      const param = {
         nameChunk: nameChunk
      };
      params.push(param);

      source.extractToObject('space', undefined, param, 'postNameSpaceChunk');
      source.extractToObject('match', '=', param, 'equalChunk');
      source.extractToObject('space', undefined, param, 'postEqualSpaceChunk');
      source.extract('peekChar', undefined, (quoteChunk) => {
         const gotQuote = quoteChunk && (quoteChunk.text === '"' || quoteChunk.text === '\'');

         if (gotQuote) {
            source.extractToObject('char', undefined, param, 'openQuoteChunk');
            source.extractToObject('all', [ quoteChunk.text ], param, 'valueChunk');
            source.extractToObject('match', quoteChunk.text, param, 'closeQuoteChunk');
            source.extractToObject('space', undefined, param, 'trailingSpaceChunk');
         }

         source.extract('word', XMLDECL_NAME_TERMINATORS, (chunk) => {
            this._addParam(source, params, chunk, deliverResults);
         });
      });
   }

}

module.exports = GentleCallback;
