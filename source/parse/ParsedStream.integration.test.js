/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { defaultExtractors, LTokenSource } from '../lToken';

import ParsedStream from './ParsedStream.js';

describe('ParsedStream (integration)', () => {
   let parser;

   beforeEach(() => {
      parser = new ParsedStream();
   });

   function expectInputToProduceTypes(input, types, done) {
      const results = [];

      parser.on('data', (data) => {
         results.push(data);
      });
      parser.on('end', () => {
         let expecteds = types;
         if (!Array.isArray(types)) {
            expecteds = [ types ];
         }

         expecteds.forEach((expected) => {
            const actuals = results.filter((actual) => actual.type === expected);

            expect(actuals[0]).toContainParsedProps({
               type: expected,
            });
         });
         done();
      });

      if (input) {
         parser.addText(input);
         parser.endText();
      }
   }

   describe('construction', () => {

      it('uses the provided LTokenSource', (done) => {
         const emd = new EntityMetaData();
         const source = new LTokenSource(defaultExtractors, emd);
         parser = new ParsedStream(source);

         source.addText('blah<elementName>');
         source.endText();

         expectInputToProduceTypes(undefined, 'CHARDATA', done);
      });

   });

   it('parses character data up to a <', (done) => {
      expectInputToProduceTypes('blah<elementName>', 'CHARDATA', done);
   });

   it('parses a comment', (done) => {
      expectInputToProduceTypes('<!-- my comment-->', 'COMMENT', done);
   });

   it('parse start and end without an internal subset', (done) => {
      expectInputToProduceTypes('<!DOCTYPE goodName SYSTEM "sys.xml">',
         [ 'DOCTYPE_START', 'DOCTYPE_END' ], done);
   });

   it('parses an element start', (done) => {
      expectInputToProduceTypes('<elementName\t>', 'ELEMENT_START', done);
   });

   it('parses an empty element', (done) => {
      expectInputToProduceTypes('<elementName/>', 'ELEMENT_EMPTY', done);
   });

   it('parses an element end', (done) => {
      expectInputToProduceTypes('</elementName\t>', 'ELEMENT_END', done);
   });

   it('parsees an ENTITY', (done) => {
      expectInputToProduceTypes('<!ENTITY myEntity PUBLIC "pub.xml" "sys.xml">', 'ENTITYDECL', done);
   });

   it('parse entity reference', (done) => {
      expectInputToProduceTypes('&foo;', 'ENTITYREF', done);
   });

   it('parse NOTATION declaration', (done) => {
      expectInputToProduceTypes('<!NOTATION foo>', 'NOTATIONDECL', done);
   });

   it('parses a processing instruction', (done) => {
      expectInputToProduceTypes('<?froz adfasdf ?>', 'PROCESSING_INSTRUCTION', done);
   });

   it('parses a space', (done) => {
      expectInputToProduceTypes('\t\n ', 'SPACE', done);
   });

   it('parses an unknown declaration', (done) => {
      expectInputToProduceTypes('<!BOGUS', 'UNKNOWNDECL', done);
   });

   it('parses a simple XML Declaration', (done) => {
      expectInputToProduceTypes('<?xml version="1.0"?>', 'XMLDECL', done);
   });

});
