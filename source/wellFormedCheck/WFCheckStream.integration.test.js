/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Offset, Range, EntityLocation } from '../basic';
import { Chunk } from '../chunk';
import { ParsedStream } from '../parse';
import { WellFormedError } from '../error';

import WFCheckStream from './WFCheckStream.js';

describe('WFCheckStream (integration)', () => {
   let parsedStream;
   let checker;

   beforeEach(() => {
      parsedStream = new ParsedStream();
      checker = new WFCheckStream();
      parsedStream.pipe(checker);
   });

   describe('XML_DECLARATION', () => {

      it('reports an error if the version attribute is the wrong case', (done) => {
         const results = [];

         checker.on('data', (data) => {
            results.push(data);
         });
         checker.on('end', () => {
            expect(results).toEqual([
               new WellFormedError('XMLDECL_ATTR_INVALID_CASE', [ 'version', 'VERSION' ],
                  new Offset(new EntityLocation(), 6, 0, 6), new Offset(new EntityLocation(), 0, 0, 0)),
               {
                  type: 'XML_DECLARATION',
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

   describe('DOCTYPE', () => {

      it('reports an error and the parsed value when the input name is bad', (done) => {
         const results = [];

         const error = new WellFormedError(WellFormedError.ID.DOCTYPE_NAME_INVALID, [ '$badName' ],
                  new Offset(new EntityLocation(), 10, 0, 10), new Offset(new EntityLocation(), 0, 0, 0));
         function evaluate() {
            expect(results).toEqual([
               error,
               {
                  type: 'DOCTYPE_START',
                  openChunk: new Chunk('<!', '<!', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)),
                  postOpenSpaceChunk: undefined,
                  declTypeChunk: new Chunk('DOCTYPE', 'DOCTYPE', new Range(new EntityLocation(), 2, 0, 2, 9, 0, 9)),
                  postDeclTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 9, 0, 9, 10, 0, 10)),
                  nameChunk: new Chunk('$badName', '$badName', new Range(new EntityLocation(), 10, 0, 10, 18, 0, 18)),
                  postNameSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 18, 0, 18, 19, 0, 19)),
                  externalId: {
                     type: 'EXTERNAL_ID',
                     typeChunk: new Chunk('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 19, 0, 19, 25, 0, 25)),
                     postTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 25, 0, 25, 26, 0, 26)),
                     systemOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 26, 0, 26, 27, 0, 27)),
                     systemChunk: new Chunk('sys.xml', 'sys.xml',
                        new Range(new EntityLocation(), 27, 0, 27, 34, 0, 34)),
                     systemCloseQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 34, 0, 34, 35, 0, 35)),
                  },
                  postExternalIdSpaceChunk: undefined,
                  startInternalSubsetChunk: new Chunk('[', '[', new Range(new EntityLocation(), 35, 0, 35, 36, 0, 36)),
               }, {
                  type: 'DOCTYPE_END',
                  closeInternalSubsetChunk: new Chunk(']', ']', new Range(new EntityLocation(), 36, 0, 36, 37, 0, 37)),
                  postCloseInternalSubsetSpaceChunk: undefined,
                  closeChunk: new Chunk('>', '>', new Range(new EntityLocation(), 37, 0, 37, 38, 0, 38)),
               },
            ]);

            done();
         }

         parsedStream.addText('<!DOCTYPE $badName SYSTEM "sys.xml"[]>');
         parsedStream.endText();

         checker.on('data', (data) => results.push(data));
         checker.on('end', evaluate);
      });

      it('reports an error and the parsed value when the close is missing', (done) => {
         const results = [];

         const error = new WellFormedError(WellFormedError.ID.DOCTYPE_NO_CLOSE, undefined,
                  new Offset(new EntityLocation(), 37, 0, 37), new Offset(new EntityLocation(), 0, 0, 0));
         function evaluate() {
            expect(results).toEqual([ {
               type: 'DOCTYPE_START',
               openChunk: new Chunk('<!', '<!', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)),
               postOpenSpaceChunk: undefined,
               declTypeChunk: new Chunk('DOCTYPE', 'DOCTYPE', new Range(new EntityLocation(), 2, 0, 2, 9, 0, 9)),
               postDeclTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 9, 0, 9, 10, 0, 10)),
               nameChunk: new Chunk('goodName', 'goodName', new Range(new EntityLocation(), 10, 0, 10, 18, 0, 18)),
               postNameSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 18, 0, 18, 19, 0, 19)),
               externalId: {
                  type: 'EXTERNAL_ID',
                  typeChunk: new Chunk('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 19, 0, 19, 25, 0, 25)),
                  postTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 25, 0, 25, 26, 0, 26)),
                  systemOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 26, 0, 26, 27, 0, 27)),
                  systemChunk: new Chunk('sys.xml', 'sys.xml',
                     new Range(new EntityLocation(), 27, 0, 27, 34, 0, 34)),
                  systemCloseQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 34, 0, 34, 35, 0, 35)),
               },
               postExternalIdSpaceChunk: undefined,
               startInternalSubsetChunk: new Chunk('[', '[', new Range(new EntityLocation(), 35, 0, 35, 36, 0, 36)),
            },
               error,
            {
               type: 'DOCTYPE_END',
               closeInternalSubsetChunk: new Chunk(']', ']', new Range(new EntityLocation(), 36, 0, 36, 37, 0, 37)),
               postCloseInternalSubsetSpaceChunk: undefined,
               closeChunk: undefined,
            } ]);

            done();
         }

         parsedStream.addText('<!DOCTYPE goodName SYSTEM "sys.xml"[]');
         parsedStream.endText();

         checker.on('data', (data) => results.push(data));
         checker.on('end', evaluate);
      });

   });

});
