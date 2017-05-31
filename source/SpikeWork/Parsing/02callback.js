console.log('02');

const XMLDECL_NAME_TERMINATORS = [ '=', '?>' ];

class callbacks {

   _gatherMultiple(source, deliverResult, descriptors) {
      this._doOne(source, {}, 0, deliverResult, descriptors);
   }

   _doOne(source, result, index, deliverResult, descriptors) {
      if (descriptors.length <= index) {
         deliverResult(result);
         return;
      }

      const descriptor = descriptors[index];
      if (descriptor.type === 'decision') {
         descriptor.decision(source, result, (newResult) => {
            this._doOne(newResult, index++, deliverResult, descriptors);
         });
      } else {
         // could optimize (not create a function each time) by seeing if there is a decision next.
         source.extract(descriptor.type, (chunk) => {
            result[descriptor.name] = chunk;
            this._doOne(source, result, index + 1, deliverResult, descriptors);
         }, descriptor.param);
      }
   }

   parseGeneral(source, deliverParse) {
      const self = this;
      this._gatherMultiple(source, deliverParse, [{
         name: 'peek',
         type: 'peekChar'
      }, {
         type: 'decision',
         decision: function parseNext(source, result, deliverResult) {
            if (!result.peek) {
               deliverResult();
            } else {
               switch (result.peek.text) {
                  case '&':
                     // reference.parse(source, callback);
                     break;
                  case '<':
                     self.parseMarkup(source, deliverResult);
                     break;
                  // must deal with close
                  default:
                     // this._parseSpaceOrContent(source, callback);
               }
            }
         }
      } ]);
   }

   /*
    * gatherMultiple(source, deliverResult:Result, descriptors)
    * decision(source, result, done:Result) // done replaces previous result
    */

   parseMarkup(source, deliverParse) {
      const self = this;
      this._gatherMultiple(source, deliverParse, [{
         name: 'openChunk',
         type: 'markup'
      }, {
         type: 'decision',
         decision: function parseNext(source, result, deliverResult) {
            if (!result.openChunk) {
               deliverResult();
            } else {
               if (result.openChunk.text === '<?') {
                  self.parseProcessingInstruction(source, result.openChunk, deliverResult);
               }
            }
         }
      } ]);
   }


   parseProcessingInstruction(source, startChunk, deliverParse) {
      this._gatherMultiple(source, deliverParse, [ {
         name: 'postOpenSpaceChunk',
         type: 'space',
       }, {
         name: 'targetChunk',
         type: 'word',
         params: [ '?>' ]
      }, {
         name: 'postTargetSpaceChunk',
         type: 'space'
      }, {
         type: 'decision',
         decision: (source, result, deliverParse) => {
            if (result.targetChunk && result.targetChunk.text.toLocaleLowerCase() === 'xml') {
               result.type = 'xmldecl';
               this._getParams(source, [], (params) => {
                  result.params = params;
                  deliverParse(result);
               });
            } else {
               result.type = 'processinginstruction';
               this._gatherMultiple(source, (innerResult) => {
                     result.instructionChunk = innerResult.instructionChunk;
                     deliverParse(result);
                  }, [{
                  name: 'instructionChunk',
                  type: 'all',
                  params: [ '?>' ],
               }]);
            }
         }
      } , {
         name: 'closeChunk',
         type: 'match',
         params: [ '?>' ],
      } ]);
   }

   _getParams(source, params, deliverParam) {
      this._gatherMultiple(source, (result) => {
         if (result.nameChunk) {
            this._getParam(source, (param) => {
               params.push(param);
               this._getParams(source, params, deliverParam);
            });
         } else {
            deliverParam(params);
         }      
      }, [ {
         name: 'nameChunk',
         type: 'peekWord',
         params: XMLDECL_NAME_TERMINATORS
       } ])
   }

   /*
    * gatherMultiple(source, deliverResult:Result, descriptors)
    * decision(source, result, done:Result) // done replaces previous result
    */

   _getParam(source, deliverParam) {
      this._gatherMultiple(source, deliverParam, [ {
         name: 'nameChunk',
         type: 'word',
         params: XMLDECL_NAME_TERMINATORS
       }, {
         name: 'postNameSpaceChunk',
         type: 'space'
      }, {
         name: 'equalChunk',
         type: 'match',
         param: '='
       }, {
         name: 'postEqualSpaceChunk',
         type: 'space'
       }, {
         name: 'openQuoteChunk',
         type: 'peekChar'
      }, {
         type: 'decision',
         decision: (source, result, done) => {
            const quoteChunk = result.openQuoteChunk;
            const gotQuote = quoteChunk && (quoteChunk.text === '"' || quoteChunk.text === '\'');

            if (gotQuote) {
               this._gatherMultiple(source, done, [ {
                  name: 'openQuoteChunk',
                  type: 'char',
               }, {
                  name: 'value',
                  type: 'all',
                  params: [ quoteChunk.text ]
               }, {
                  name: 'closeQuoteChunk',
                  type: 'match',
                  prams: quoteChunk.text
               }, {
                  name: 'trailingSpaceChunk',
                  type: 'space'
               } ]);
            } else {
               // equal with no quote
               // or no equal
            }
         }
      } ]);      
   }

}

module.exports = callbacks;