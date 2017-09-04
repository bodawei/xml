/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { makeLTokenMaker } from '../lToken/test';
import { EntityMetaData } from '../basic';
import { defaultExtractors, LTokenSource } from '../lToken';

import ParsedStream from './ParsedStream.js';

describe('ParsedStream (integration)', () => {
   let parser;
   let makeLToken;

   beforeEach(() => {
      makeLToken = makeLTokenMaker();
      parser = new ParsedStream();
   });

   function expectInputToProduce(input, parsings, done) {
      const results = [];

      parser.on('data', (data) => {
         results.push(data);
      });
      parser.on('end', () => {
         let expecteds = parsings;
         if (!Array.isArray(parsings)) {
            expecteds = [ parsings ];
         }

         expecteds.forEach((expected) => {
            const actuals = results.filter((actual) => actual.type === expected.type);

            expect(actuals[0]).toEqual(expected);
         });
         done();
      });
      parser.addText(input);
      parser.endText();
   }

   function expectInputToProduce2(input, parsings, done) {
      const results = [];

      parser.on('data', (data) => {
         results.push(data);
      });
      parser.on('end', () => {
         let expecteds = parsings;
         if (!Array.isArray(parsings)) {
            expecteds = [ parsings ];
         }

         expecteds.forEach((expected) => {
            const actuals = results.filter((actual) => actual.type === expected.type);

            expect(actuals[0]).toContainParsedProps(expected);
         });
         done();
      });
      parser.addText(input);
      parser.endText();
   }

   describe('parameters', () => {

      it('uses the provided LTokenSource', (done) => {
         const emd = new EntityMetaData();
         const source = new LTokenSource(defaultExtractors, emd);
         parser = new ParsedStream(source);
         const results = [];
         const expecteds = [ {
            type: 'CHARDATA',
            text: makeLToken('blah'),
         } ];
         parser.on('data', (data) => {
            results.push(data);
         });
         parser.on('end', () => {
            expecteds.forEach((expected) => {
               const actuals = results.filter((actual) => actual.type === expected.type);

               expect(actuals[0]).toContainParsedProps(expected);
            });
            done();
         });

         source.addText('blah<elementName>');
         source.endText();
      });

   });

   describe('CharData', () => {

      it('parses character data up to a <', (done) => {
         expectInputToProduce('blah<elementName>', {
            type: 'CHARDATA',
            text: makeLToken('blah'),
         }, done);
      });

   });

   describe('DOCTYPE', () => {

      it('parse simple start and end', (done) => {
         expectInputToProduce('<!DOCTYPE goodName SYSTEM "sys.xml"[]>', [ {
            type: 'DOCTYPE_START',
            open: makeLToken('<!'),
            postOpenSpace: undefined,
            declType: makeLToken('DOCTYPE'),
            postDeclTypeSpace: makeLToken(' '),
            name: makeLToken('goodName'),
            postNameSpace: makeLToken(' '),
            externalId: {
               type: 'EXTERNAL_ID',
               idType: makeLToken('SYSTEM'),
               postIdTypeSpace: makeLToken(' '),
               systemOpenQuote: makeLToken('"'),
               systemValue: makeLToken('sys.xml'),
               systemCloseQuote: makeLToken('"'),
            },
            postExternalIdSpace: undefined,
            startInternalSubset: makeLToken('['),
         }, {
            type: 'DOCTYPE_END',
            closeInternalSubset: makeLToken(']'),
            postCloseInternalSubsetSpace: undefined,
            close: makeLToken('>'),
         } ], done);
      });

      it('parse start and end without an internal subset', (done) => {
         expectInputToProduce('<!DOCTYPE goodName SYSTEM "sys.xml">', [ {
            type: 'DOCTYPE_START',
            open: makeLToken('<!'),
            postOpenSpace: undefined,
            declType: makeLToken('DOCTYPE'),
            postDeclTypeSpace: makeLToken(' '),
            name: makeLToken('goodName'),
            postNameSpace: makeLToken(' '),
            externalId: {
               type: 'EXTERNAL_ID',
               idType: makeLToken('SYSTEM'),
               postIdTypeSpace: makeLToken(' '),
               systemOpenQuote: makeLToken('"'),
               systemValue: makeLToken('sys.xml'),
               systemCloseQuote: makeLToken('"'),
            },
            postExternalIdSpace: undefined,
            startInternalSubset: undefined,
         }, {
            type: 'DOCTYPE_END',
            closeInternalSubset: undefined,
            postCloseInternalSubsetSpace: undefined,
            close: makeLToken('>'),
         } ], done);
      });

   });

   describe('element start', () => {

      it('parse tag', (done) => {
         expectInputToProduce('<elementName\t>', {
            type: 'ELEMENT_START',
            open: makeLToken('<'),
            postOpenSpace: undefined,
            name: makeLToken('elementName'),
            postNameSpace: makeLToken('\t'),
            close: makeLToken('>'),
         }, done);
      });

   });

   describe('element end', () => {

      it('parse tag', (done) => {
         expectInputToProduce('</elementName\t>', {
            type: 'ELEMENT_END',
            open: makeLToken('</'),
            postOpenSpace: undefined,
            name: makeLToken('elementName'),
            postNameSpace: makeLToken('\t'),
            close: makeLToken('>'),
         }, done);
      });

   });

   describe('ENTITY', () => {

      it('parse entity', (done) => {
         expectInputToProduce('<!ENTITY myEntity PUBLIC "pub.xml" "sys.xml">', {
            type: 'ENTITYDECL',
            open: makeLToken('<!'),
            postOpenSpace: undefined,
            declType: makeLToken('ENTITY'),
            postDeclTypeSpace: makeLToken(' '),
            name: makeLToken('myEntity'),
            postNameSpace: makeLToken(' '),
            externalId: {
               type: 'EXTERNAL_ID',
               idType: makeLToken('PUBLIC'),
               postIdTypeSpace: makeLToken(' '),
               publicOpenQuote: makeLToken('"'),
               publicValue: makeLToken('pub.xml'),
               publicCloseQuote: makeLToken('"'),
               postPublicSpace: makeLToken(' '),
               systemOpenQuote: makeLToken('"'),
               systemValue: makeLToken('sys.xml'),
               systemCloseQuote: makeLToken('"'),
            },
            postExternalIdSpace: undefined,
            close: makeLToken('>'),
         }, done);
      });

   });

   describe('entity reference', () => {

      it('parse entity reference', (done) => {
         expectInputToProduce2('&foo;', {
            type: 'ENTITYREF',
         }, done);
      });

   });

   describe('UNKNOWNDECL', () => {

      it('parse entity', (done) => {
         expectInputToProduce('<!BOGUS', {
            type: 'UNKNOWNDECL',
            open: makeLToken('<!'),
            postOpenSpace: undefined,
            declType: makeLToken('BOGUS'),
            postDeclTypeSpace: undefined,
         }, done);
      });

   });

   describe('XmlDeclaration', () => {

      it('parses a simple declaration', (done) => {
         expectInputToProduce('<?xml version="1.0"?>', {
            type: 'XMLDECL',
            open: makeLToken('<?'),
            postOpenSpace: undefined,
            target: makeLToken('xml'),
            postTargetSpace: makeLToken(' '),
            params: [ {
               name: makeLToken('version'),
               postNameSpace: undefined,
               equal: makeLToken('='),
               postEqualSpace: undefined,
               paramOpenQuote: makeLToken('"'),
               paramValue: makeLToken('1.0'),
               paramCloseQuote: makeLToken('"'),
               trailingSpace: undefined,
            } ],
            close: makeLToken('?>'),
         }, done);
      });

   });

});
