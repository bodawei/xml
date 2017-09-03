/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

const ParsedStream = require('../parser/ParsedStream.js');
const Tokenizer = require('./Tokenizer.js');
const token = require('../xmlToken');

describe('ParsedStream', () => {
   let parser;
   let tokenizer;

   beforeEach(() => {
      parser = new ParsedStream();
      tokenizer = new Tokenizer();
      parser.pipe(tokenizer);
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

         parser.addText('<!DOCTYPE one');
         parser.endText();

         tokenizer.on('data', (data) => results.push(data));
         tokenizer.on('end', evaluate);
      });

   });

});
