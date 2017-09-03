/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

const parsed = require('../parser');
const token = require('../xmlToken');

const TokenStream = require('./TokenStream.js');

describe('TokenStream', () => {
   let parsedStream;
   let tokenStream;

   beforeEach(() => {
      parsedStream = new parsed.ParsedStream();
      tokenStream = new TokenStream();
      parsedStream.pipe(tokenStream);
   });

   describe('DOCTYPE', () => {

      it('tokenize a parsed', (done) => {
         const results = [];

         function evaluate() {
            expect(results).toEqual([
               new token.docTypeStart.DocTypeStart('one', undefined, []),
            ]);

            done();
         }

         parsedStream.addText('<!DOCTYPE one');
         parsedStream.endText();

         tokenStream.on('data', (data) => results.push(data));
         tokenStream.on('end', evaluate);
      });

   });

});
