/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Offset, Range, EntityLocation } from '../basic';
import { Chunk } from '../chunk';
import { ParsedStream } from '../parse';
import { WellFormedError } from '../error';

import WFCheckStream from './WFCheckStream.js';

describe('WFCheckStream', () => {
   let parsedStream;
   let checker;

   beforeEach(() => {
      parsedStream = new ParsedStream();
      checker = new WFCheckStream();
      parsedStream.pipe(checker);
   });

   it('one', (done) => {
      const results = [];

      checker.on('data', (data) => {
         results.push(data);
      });
      checker.on('end', () => {
         expect(results).toEqual([
            new WellFormedError('XMLDECL_ATTR_INVALID_CASE', [ 'version', 'VERSION' ],
               new Offset(new EntityLocation(), 2, 0, 2), new Offset(new EntityLocation(), 0, 0, 0)),
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
               } ],
               closeChunk:  new Chunk('?>', '?>', new Range(new EntityLocation(), 19, 0, 19, 21, 0, 21)),
            },
         ]);
         done();
      });
      parsedStream.addText('<?xml VERSION="1.0"?>');
      parsedStream.endText();
   });

});
