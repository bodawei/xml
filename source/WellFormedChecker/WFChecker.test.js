/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Chunk = require('../chunk/Chunk.js');
const Range = require('../Basic/Range.js');
const Offset = require('../Basic/Offset.js');
const EntityLocation = require('../shared/EntityLocation.js');
const SyntaxError = require('../error/SyntaxError.js');

const StringParser = require('../Parse/04parser.js');
const WFChecker = require('./WFChecker.js');

describe('WFChecker', () => {
   let parser;
   let checker;

    beforeEach(() => {
      parser = new StringParser();
      checker = new WFChecker();
      parser.pipe(checker);
    });

    it('one', (done) => {
      const results = [];

      checker.on('data', (data) => {
         console.log(Date.now(), 'CHECKER DATA!', data);
         results.push(data);
      });
      checker.on('end', () => {
         console.log(Date.now(), 'done!');
         expect(results).toEqual([
            new SyntaxError('XMLDECL_ATTR_INVALID_CASE', [ 'version', 'VERSION' ], new Offset(new EntityLocation(), 6, 0, 6)),
            {
               type: 'xmldecl',
               openChunk: new Chunk('<?', '<?', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)),
               postOpenSpaceChunk: undefined,
               targetChunk: new Chunk('xml', 'xml', new Range(new EntityLocation(), 2, 0, 2, 5, 0, 5)),
               postTargetSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 5, 0, 5, 6, 0, 6)),
               params: [ {
                  nameChunk: new Chunk('VERSION', 'VERSION', new Range(new EntityLocation(), 6, 0, 6, 13, 0, 13)),
                  postNameSpaceChunk: undefined,
                  equalChunk: new Chunk('=', '=', new Range(new EntityLocation(), 13, 0, 13, 14, 0, 14)),
                  postEqualSpaceChunk: undefined,
                  openQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 14, 0, 14, 15, 0, 15)),
                  valueChunk: new Chunk('1.0', '1.0', new Range(new EntityLocation(), 15, 0, 15, 18, 0, 18)),
                  closeQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 18, 0, 18, 19, 0, 19)),
                  trailingSpaceChunk: undefined,
               }],
               closeChunk:  new Chunk('?>', '?>', new Range(new EntityLocation(), 19, 0, 19, 21, 0, 21))
            }
         ]);
         done();
      });
      console.log(Date.now());
      parser.addText('<?xml VERSION="1.0"?>');
      console.log(Date.now());
      parser.endText();
      console.log(Date.now());

    });

 });
