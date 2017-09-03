/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Chunk = require('../chunk/Chunk.js');
const Range = require('../Basic/Range.js');
const Offset = require('../Basic/Offset.js');
const EntityLocation = require('../shared/EntityLocation.js');
const tokens = require('../XmlToken.js');

const StringParser = require('../Parse/04parser.js');
const Tokenizer = require('./Tokenizer.js');

describe('Tokenizer', () => {
   let parser;
   let tokenizer;

    beforeEach(() => {
      parser = new StringParser();
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
            new tokens.XmlDeclaration([{
               name: 'version',
               value: '1.0'
            }], [])
         ]);
         done();
      });
      parser.addText('<?xml version="1.0"?>');
      parser.endText();
    });

 });
