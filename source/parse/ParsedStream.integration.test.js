/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { makeLTokenMaker } from '../lToken/test';

import ParsedStream from './ParsedStream.js';

describe('ParsedStream', () => {
   let parser;

   beforeEach(() => {
      parser = new ParsedStream();
   });

   function inputToOutput(input, evaluator) {
      const results = [];

      parser.on('data', (data) => {
         results.push(data);
      });
      parser.on('end', () => {
         evaluator(results);
      });
      parser.addText(input);
      parser.endText();
   }

   describe('XmlDeclaration', () => {

      it('parses a simple declaration', (done) => {
         const makeLToken = makeLTokenMaker();
         const parsedDecl = {
            type: 'XML_DECLARATION',
            openLToken: makeLToken('<?'),
            postOpenSpaceLToken: undefined,
            targetLToken: makeLToken('xml'),
            postTargetSpaceLToken: makeLToken(' '),
            params: [ {
               nameLToken: makeLToken('version'),
               postNameSpaceLToken: undefined,
               equalLToken: makeLToken('='),
               postEqualSpaceLToken: undefined,
               openQuoteLToken: makeLToken('"'),
               valueLToken: makeLToken('1.0'),
               closeQuoteLToken: makeLToken('"'),
               trailingSpaceLToken: undefined,
            } ],
            closeLToken: makeLToken('?>'),
         };

         inputToOutput('<?xml version="1.0"?>', (results) => {
            expect(results).toEqual([
               parsedDecl,
            ]);
            done();
         });
      });

   });

   describe('DOCTYPE', () => {

      it('parse simple start and end', (done) => {
         const makeLToken = makeLTokenMaker();
         const startParsing = {
            type: 'DOCTYPE_START',
            openLToken: makeLToken('<!'),
            postOpenSpaceLToken: undefined,
            declTypeLToken: makeLToken('DOCTYPE'),
            postDeclTypeSpaceLToken: makeLToken(' '),
            nameLToken: makeLToken('goodName'),
            postNameSpaceLToken: makeLToken(' '),
            externalId: {
               type: 'EXTERNAL_ID',
               typeLToken: makeLToken('SYSTEM'),
               postTypeSpaceLToken: makeLToken(' '),
               systemOpenQuoteLToken: makeLToken('"'),
               systemLToken: makeLToken('sys.xml'),
               systemCloseQuoteLToken: makeLToken('"'),
            },
            postExternalIdSpaceLToken: undefined,
            startInternalSubsetLToken: makeLToken('['),
         };
         const endParsing = {
            type: 'DOCTYPE_END',
            closeInternalSubsetLToken: makeLToken(']'),
            postCloseInternalSubsetSpaceLToken: undefined,
            closeLToken: makeLToken('>'),
         };

         inputToOutput('<!DOCTYPE goodName SYSTEM "sys.xml"[]>', (results) => {
            expect(results).toEqual([
               startParsing,
               endParsing,
            ]);
            done();
         });
      });

      it('parse start and end without an internal subset', (done) => {
         const makeLToken = makeLTokenMaker();
         const startParsing = {
            type: 'DOCTYPE_START',
            openLToken: makeLToken('<!'),
            postOpenSpaceLToken: undefined,
            declTypeLToken: makeLToken('DOCTYPE'),
            postDeclTypeSpaceLToken: makeLToken(' '),
            nameLToken: makeLToken('goodName'),
            postNameSpaceLToken: makeLToken(' '),
            externalId: {
               type: 'EXTERNAL_ID',
               typeLToken: makeLToken('SYSTEM'),
               postTypeSpaceLToken: makeLToken(' '),
               systemOpenQuoteLToken: makeLToken('"'),
               systemLToken: makeLToken('sys.xml'),
               systemCloseQuoteLToken: makeLToken('"'),
            },
            postExternalIdSpaceLToken: undefined,
            startInternalSubsetLToken: undefined,
         };
         const endParsing = {
            type: 'DOCTYPE_END',
            closeInternalSubsetLToken: undefined,
            postCloseInternalSubsetSpaceLToken: undefined,
            closeLToken: makeLToken('>'),
         };

         inputToOutput('<!DOCTYPE goodName SYSTEM "sys.xml">', (results) => {
            expect(results).toEqual([
               startParsing,
               endParsing,
            ]);
            done();
         });
      });

   });

   describe('ENTITY', () => {

      it('parse entity', (done) => {
         const makeLToken = makeLTokenMaker();
         const parsedDecl = {
            type: 'ENTITY_DECL',
            openLToken: makeLToken('<!'),
            postOpenSpaceLToken: undefined,
            declTypeLToken: makeLToken('ENTITY'),
            postDeclTypeSpaceLToken: makeLToken(' '),
            nameLToken: makeLToken('myEntity'),
            postNameSpaceLToken: makeLToken(' '),
            externalId: {
               type: 'EXTERNAL_ID',
               typeLToken: makeLToken('PUBLIC'),
               postTypeSpaceLToken: makeLToken(' '),
               publicOpenQuoteLToken: makeLToken('"'),
               publicLToken: makeLToken('pub.xml'),
               publicCloseQuoteLToken: makeLToken('"'),
               postPublicSpaceLToken: makeLToken(' '),
               systemOpenQuoteLToken: makeLToken('"'),
               systemLToken: makeLToken('sys.xml'),
               systemCloseQuoteLToken: makeLToken('"'),
            },
            postExternalIdSpaceLToken: undefined,
            closeLToken: makeLToken('>'),
         };

         inputToOutput('<!ENTITY myEntity PUBLIC "pub.xml" "sys.xml">', (results) => {
            expect(results).toEqual([
               parsedDecl,
            ]);
            done();
         });
      });

   });

});
