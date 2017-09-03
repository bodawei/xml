/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

const Chunk = require('../chunk/Chunk.js');
const Range = require('../basic/Range.js');
const EntityLocation = require('../basic/EntityLocation.js');

const ParsedStream = require('./ParsedStream.js');

describe('ParsedStream', () => {
   let parser;

   beforeEach(() => {
      parser = new ParsedStream();
   });

   it('XMLDECLARATION', (done) => {
      const results = [];

      parser.on('data', (data) => {
         results.push(data);
      });
      parser.on('end', () => {
         expect(results).toEqual([
            {
               type: 'xmldecl',
               openChunk: new Chunk('<?', '<?', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)),
               postOpenSpaceChunk: undefined,
               targetChunk: new Chunk('xml', 'xml', new Range(new EntityLocation(), 2, 0, 2, 5, 0, 5)),
               postTargetSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 5, 0, 5, 6, 0, 6)),
               params: [ {
                  nameChunk: new Chunk('version', 'version', new Range(new EntityLocation(), 6, 0, 6, 13, 0, 13)),
                  postNameSpaceChunk: undefined,
                  equalChunk: new Chunk('=', '=', new Range(new EntityLocation(), 13, 0, 13, 14, 0, 14)),
                  postEqualSpaceChunk: undefined,
                  openQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 14, 0, 14, 15, 0, 15)),
                  valueChunk: new Chunk('1.0', '1.0', new Range(new EntityLocation(), 15, 0, 15, 18, 0, 18)),
                  closeQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 18, 0, 18, 19, 0, 19)),
                  trailingSpaceChunk: undefined,
               } ],
               closeChunk:  new Chunk('?>', '?>', new Range(new EntityLocation(), 19, 0, 19, 21, 0, 21)),
            },
         ]);
         done();
      });
      parser.addText('<?xml version="1.0"?>');
      parser.endText();
   });

   describe('DOCTYPE', () => {

      it('parse simple start', (done) => {
         const results = [];

         function evaluate() {
            expect(results).toEqual([ {
               type: 'DOCTYPE_START',
               openChunk: new Chunk('<!', '<!', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)),
               postOpenSpaceChunk: undefined,
               declTypeChunk: new Chunk('DOCTYPE', 'DOCTYPE', new Range(new EntityLocation(), 2, 0, 2, 9, 0, 9)),
               postDeclTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 9, 0, 9, 10, 0, 10)),
               nameChunk: new Chunk('one', 'one', new Range(new EntityLocation(), 10, 0, 10, 13, 0, 13)),
               postNameSpaceChunk: undefined,
               startInternalSubsetChunk: undefined,
               postExternalIdSpaceChunk: undefined,
            } ]);

            done();
         }

         parser.addText('<!DOCTYPE one');
         parser.endText();

         parser.on('data', (data) => results.push(data));
         parser.on('end', evaluate);
      });

   });

});
