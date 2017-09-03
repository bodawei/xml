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
               openQuote: makeLToken('"'),
               value: makeLToken('1.0'),
               closeQuote: makeLToken('"'),
               trailingSpace: undefined,
            } ],
            close: makeLToken('?>'),
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
            open: makeLToken('<!'),
            postOpenSpace: undefined,
            declType: makeLToken('DOCTYPE'),
            postDeclTypeSpace: makeLToken(' '),
            name: makeLToken('goodName'),
            postNameSpace: makeLToken(' '),
            externalId: {
               type: 'EXTERNAL_ID',
               idType: makeLToken('SYSTEM'),
               postTypeSpace: makeLToken(' '),
               systemOpenQuote: makeLToken('"'),
               systemValue: makeLToken('sys.xml'),
               systemCloseQuote: makeLToken('"'),
            },
            postExternalIdSpace: undefined,
            startInternalSubset: makeLToken('['),
         };
         const endParsing = {
            type: 'DOCTYPE_END',
            closeInternalSubset: makeLToken(']'),
            postCloseInternalSubsetSpace: undefined,
            close: makeLToken('>'),
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
            open: makeLToken('<!'),
            postOpenSpace: undefined,
            declType: makeLToken('DOCTYPE'),
            postDeclTypeSpace: makeLToken(' '),
            name: makeLToken('goodName'),
            postNameSpace: makeLToken(' '),
            externalId: {
               type: 'EXTERNAL_ID',
               idType: makeLToken('SYSTEM'),
               postTypeSpace: makeLToken(' '),
               systemOpenQuote: makeLToken('"'),
               systemValue: makeLToken('sys.xml'),
               systemCloseQuote: makeLToken('"'),
            },
            postExternalIdSpace: undefined,
            startInternalSubset: undefined,
         };
         const endParsing = {
            type: 'DOCTYPE_END',
            closeInternalSubset: undefined,
            postCloseInternalSubsetSpace: undefined,
            close: makeLToken('>'),
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
               postTypeSpace: makeLToken(' '),
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
