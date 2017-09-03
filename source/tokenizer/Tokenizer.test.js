/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

const token = require('../xmlToken');

const ParsedStream = require('../parser/ParsedStream.js');
const Tokenizer = require('./Tokenizer.js');

describe('Tokenizer', () => {
   let parser;
   let tokenizer;

   beforeEach(() => {
      parser = new ParsedStream();
      tokenizer = new Tokenizer();
      parser.pipe(tokenizer);
   });

   it('lets do it', (done) => {
      const results = [];

      tokenizer.on('data', (data) => {
         results.push(data);
      });
      tokenizer.on('end', () => {
         expect(results).toEqual([
            new token.XmlDeclaration.XmlDeclaration([ {
               name: 'version',
               value: '1.0',
            } ], []),
         ]);
         done();
      });
      parser.addText('<?xml version="1.0"?>');
      parser.endText();
   });

});
