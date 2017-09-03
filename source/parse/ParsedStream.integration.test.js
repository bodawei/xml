/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../basic';
import { Chunk } from '../chunk';

import ParsedStream from './ParsedStream.js';

describe('ParsedStream', () => {
   let parser;

   beforeEach(() => {
      parser = new ParsedStream();
   });

   describe('XmlDeclaration', () => {

      it('parses a simple declaration', (done) => {
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
               nameChunk: new Chunk('goodName', 'goodName', new Range(new EntityLocation(), 10, 0, 10, 18, 0, 18)),
               postNameSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 18, 0, 18, 19, 0, 19)),
               externalId: {
                  type: 'EXTERNAL_ID',
                  typeChunk: new Chunk('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 19, 0, 19, 25, 0, 25)),
                  postTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 25, 0, 25, 26, 0, 26)),
                  systemOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 26, 0, 26, 27, 0, 27)),
                  systemChunk: new Chunk('sys.xml', 'sys.xml', new Range(new EntityLocation(), 27, 0, 27, 34, 0, 34)),
                  systemCloseQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 34, 0, 34, 35, 0, 35)),
               },
               postExternalIdSpaceChunk: undefined,
               startInternalSubsetChunk: new Chunk('[', '[', new Range(new EntityLocation(), 35, 0, 35, 36, 0, 36)),
            } ]);

            done();
         }

         parser.addText('<!DOCTYPE goodName SYSTEM "sys.xml"[');
         parser.endText();

         parser.on('data', (data) => results.push(data));
         parser.on('end', evaluate);
      });

   });

   describe('ENTITY', () => {

      it('parse entity', (done) => {
         const results = [];

         function evaluate() {
            expect(results).toEqual([ {
               type: 'ENTITY_DECL',
               openChunk: new Chunk('<!', '<!', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)),
               postOpenSpaceChunk: undefined,
               declTypeChunk: new Chunk('ENTITY', 'ENTITY', new Range(new EntityLocation(), 2, 0, 2, 8, 0, 8)),
               postDeclTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 8, 0, 8, 9, 0, 9)),
               nameChunk: new Chunk('myEntity', 'myEntity', new Range(new EntityLocation(), 9, 0, 9, 17, 0, 17)),
               postNameSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
               externalId: {
                  type: 'EXTERNAL_ID',
                  typeChunk: new Chunk('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 18, 0, 18, 24, 0, 24)),
                  postTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 24, 0, 24, 25, 0, 25)),
                  publicOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 25, 0, 25, 26, 0, 26)),
                  publicChunk: new Chunk('pub.xml', 'pub.xml', new Range(new EntityLocation(), 26, 0, 26, 33, 0, 33)),
                  publicCloseQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 33, 0, 33, 34, 0, 34)),
                  postPublicSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 34, 0, 34, 35, 0, 35)),
                  systemOpenQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 35, 0, 35, 36, 0, 36)),
                  systemChunk: new Chunk('sys.xml', 'sys.xml', new Range(new EntityLocation(), 36, 0, 36, 43, 0, 43)),
                  systemCloseQuoteChunk: new Chunk('"', '"', new Range(new EntityLocation(), 43, 0, 43, 44, 0, 44)),
               },
               postExternalIdSpaceChunk: undefined,
               closeChunk: new Chunk('>', '>', new Range(new EntityLocation(), 44, 0, 44, 45, 0, 45)),
            } ]);

            done();
         }

         parser.addText('<!ENTITY myEntity PUBLIC "pub.xml" "sys.xml">');
         parser.endText();

         parser.on('data', (data) => results.push(data));
         parser.on('end', evaluate);
      });

   });

   // note '<!ENTITY myEntity SYSTEM "sys.xml" "pub.xml">'  fails right now by hanging
});
