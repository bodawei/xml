/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../basic';
import { LToken } from '../lToken';

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
                  type: 'XML_DECLARATION',
                  openLToken: new LToken('<?', '<?', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)),
                  postOpenSpaceLToken: undefined,
                  targetLToken: new LToken('xml', 'xml', new Range(new EntityLocation(), 2, 0, 2, 5, 0, 5)),
                  postTargetSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 5, 0, 5, 6, 0, 6)),
                  params: [ {
                     nameLToken: new LToken('version', 'version', new Range(new EntityLocation(), 6, 0, 6, 13, 0, 13)),
                     postNameSpaceLToken: undefined,
                     equalLToken: new LToken('=', '=', new Range(new EntityLocation(), 13, 0, 13, 14, 0, 14)),
                     postEqualSpaceLToken: undefined,
                     openQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 14, 0, 14, 15, 0, 15)),
                     valueLToken: new LToken('1.0', '1.0', new Range(new EntityLocation(), 15, 0, 15, 18, 0, 18)),
                     closeQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 18, 0, 18, 19, 0, 19)),
                     trailingSpaceLToken: undefined,
                  } ],
                  closeLToken:  new LToken('?>', '?>', new Range(new EntityLocation(), 19, 0, 19, 21, 0, 21)),
               },
            ]);
            done();
         });
         parser.addText('<?xml version="1.0"?>');
         parser.endText();
      });

   });

   describe('DOCTYPE', () => {

      it('parse simple start and end', (done) => {
         const results = [];

         function evaluate() {
            expect(results).toEqual([ {
               type: 'DOCTYPE_START',
               openLToken: new LToken('<!', '<!', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)),
               postOpenSpaceLToken: undefined,
               declTypeLToken: new LToken('DOCTYPE', 'DOCTYPE', new Range(new EntityLocation(), 2, 0, 2, 9, 0, 9)),
               postDeclTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 9, 0, 9, 10, 0, 10)),
               nameLToken: new LToken('goodName', 'goodName', new Range(new EntityLocation(), 10, 0, 10, 18, 0, 18)),
               postNameSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 18, 0, 18, 19, 0, 19)),
               externalId: {
                  type: 'EXTERNAL_ID',
                  typeLToken: new LToken('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 19, 0, 19, 25, 0, 25)),
                  postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 25, 0, 25, 26, 0, 26)),
                  systemOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 26, 0, 26, 27, 0, 27)),
                  systemLToken: new LToken('sys.xml', 'sys.xml', new Range(new EntityLocation(), 27, 0, 27, 34, 0, 34)),
                  systemCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 34, 0, 34, 35, 0, 35)),
               },
               postExternalIdSpaceLToken: undefined,
               startInternalSubsetLToken: new LToken('[', '[', new Range(new EntityLocation(), 35, 0, 35, 36, 0, 36)),
            }, {
               type: 'DOCTYPE_END',
               closeInternalSubsetLToken: new LToken(']', ']', new Range(new EntityLocation(), 36, 0, 36, 37, 0, 37)),
               postCloseInternalSubsetSpaceLToken: undefined,
               closeLToken: new LToken('>', '>', new Range(new EntityLocation(), 37, 0, 37, 38, 0, 38)),
            } ]);

            done();
         }

         parser.addText('<!DOCTYPE goodName SYSTEM "sys.xml"[]>');
         parser.endText();

         parser.on('data', (data) => results.push(data));
         parser.on('end', evaluate);
      });

      it('parse start and end without an internal subset', (done) => {
         const results = [];

         function evaluate() {
            expect(results).toEqual([ {
               type: 'DOCTYPE_START',
               openLToken: new LToken('<!', '<!', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)),
               postOpenSpaceLToken: undefined,
               declTypeLToken: new LToken('DOCTYPE', 'DOCTYPE', new Range(new EntityLocation(), 2, 0, 2, 9, 0, 9)),
               postDeclTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 9, 0, 9, 10, 0, 10)),
               nameLToken: new LToken('goodName', 'goodName', new Range(new EntityLocation(), 10, 0, 10, 18, 0, 18)),
               postNameSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 18, 0, 18, 19, 0, 19)),
               externalId: {
                  type: 'EXTERNAL_ID',
                  typeLToken: new LToken('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 19, 0, 19, 25, 0, 25)),
                  postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 25, 0, 25, 26, 0, 26)),
                  systemOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 26, 0, 26, 27, 0, 27)),
                  systemLToken: new LToken('sys.xml', 'sys.xml', new Range(new EntityLocation(), 27, 0, 27, 34, 0, 34)),
                  systemCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 34, 0, 34, 35, 0, 35)),
               },
               postExternalIdSpaceLToken: undefined,
               startInternalSubsetLToken: undefined,
            }, {
               type: 'DOCTYPE_END',
               closeInternalSubsetLToken: undefined,
               postCloseInternalSubsetSpaceLToken: undefined,
               closeLToken: new LToken('>', '>', new Range(new EntityLocation(), 35, 0, 35, 36, 0, 36)),
            } ]);

            done();
         }

         parser.addText('<!DOCTYPE goodName SYSTEM "sys.xml">');
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
               openLToken: new LToken('<!', '<!', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)),
               postOpenSpaceLToken: undefined,
               declTypeLToken: new LToken('ENTITY', 'ENTITY', new Range(new EntityLocation(), 2, 0, 2, 8, 0, 8)),
               postDeclTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 8, 0, 8, 9, 0, 9)),
               nameLToken: new LToken('myEntity', 'myEntity', new Range(new EntityLocation(), 9, 0, 9, 17, 0, 17)),
               postNameSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 17, 0, 17, 18, 0, 18)),
               externalId: {
                  type: 'EXTERNAL_ID',
                  typeLToken: new LToken('PUBLIC', 'PUBLIC', new Range(new EntityLocation(), 18, 0, 18, 24, 0, 24)),
                  postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 24, 0, 24, 25, 0, 25)),
                  publicOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 25, 0, 25, 26, 0, 26)),
                  publicLToken: new LToken('pub.xml', 'pub.xml', new Range(new EntityLocation(), 26, 0, 26, 33, 0, 33)),
                  publicCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 33, 0, 33, 34, 0, 34)),
                  postPublicSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 34, 0, 34, 35, 0, 35)),
                  systemOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 35, 0, 35, 36, 0, 36)),
                  systemLToken: new LToken('sys.xml', 'sys.xml', new Range(new EntityLocation(), 36, 0, 36, 43, 0, 43)),
                  systemCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 43, 0, 43, 44, 0, 44)),
               },
               postExternalIdSpaceLToken: undefined,
               closeLToken: new LToken('>', '>', new Range(new EntityLocation(), 44, 0, 44, 45, 0, 45)),
            } ]);

            done();
         }

         parser.addText('<!ENTITY myEntity PUBLIC "pub.xml" "sys.xml">');
         parser.endText();

         parser.on('data', (data) => results.push(data));
         parser.on('end', evaluate);
      });

   });

});
