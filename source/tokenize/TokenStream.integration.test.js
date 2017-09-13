/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData } from '../basic';
import { makeLTokenMaker } from '../lToken/test';
import { ParsedStream } from '../parse';
import {
   declaration,
   charData,
   docTypeStart,
   docTypeEnd,
   entityDeclaration,
   elementEnd,
   elementStart,
   entityReference,
   notationDeclaration,
   processingInstruction,
   text,
   xmlDeclaration,
} from '../xToken';

import TokenStream from './TokenStream.js';

describe('TokenStream (integration)', () => {
   let parsedStream;
   let tokenStream;
   let makeLToken;

   beforeEach(() => {
      makeLToken = makeLTokenMaker();
      parsedStream = new ParsedStream();
      tokenStream = new TokenStream();
      parsedStream.pipe(tokenStream);
   });

   function expectInputToProduce(inputDocument, expecteds, done) {
      const results = [];

      parsedStream.addText(inputDocument);
      parsedStream.endText();

      tokenStream.on('data', (data) => results.push(data));
      tokenStream.on('end', () => {
         if (!Array.isArray(expecteds)) {
            expecteds = [ expecteds ];
         }

         expecteds.forEach((expected) => {
            const actuals = results.filter((actual) => actual instanceof expected.constructor);

            if (expected.lTokens && expected.lTokens.length === 0) {
               actuals[0].lTokens = [];
            }

            expect(actuals[0]).toEqual(expected);
         });
         done();
      });
   }

   describe('UNKNOWNDECL', () => {

      it('do a simple end to end process', (done) => {
         expectInputToProduce('<!BOGUS', [
            new EntityMetaData(),
            new declaration.Token([
               makeLToken('<!'),
               makeLToken('BOGUS'),
            ]),
         ], done);
      });

   });

   describe('charData', () => {

      it('produces a CharData token from text', (done) => {
         expectInputToProduce('some$ text ', new charData.Token('some$ text ', [
            makeLToken('some$ text '),
         ]), done);
      });

   });

   describe('DOCTYPE', () => {

      it('tokenize a parsed', (done) => {
         expectInputToProduce('<!DOCTYPE one>', [
            new docTypeStart.Token('one', undefined, false, [
               makeLToken('<!'),
               makeLToken('DOCTYPE'),
               makeLToken(' '),
               makeLToken('one'),
            ]),
            new docTypeEnd.Token([
               makeLToken('>'),
            ]),
         ], done);
      });

   });

   describe('element start', () => {

      it('do a simple end to end process', (done) => {
         expectInputToProduce('<elementName>', [
            new elementStart.Token('elementName', [], [
               makeLToken('<'),
               makeLToken('elementName'),
               makeLToken('>'),
            ]),
         ], done);
      });

   });

   describe('element end', () => {

      it('tokenizes the input', (done) => {
         expectInputToProduce('</elementName>', [
            new elementEnd.Token('elementName', [
               makeLToken('</'),
               makeLToken('elementName'),
               makeLToken('>'),
            ]),
         ], done);
      });

   });

   describe('ENTITY', () => {

      it('do a simple end to end process', (done) => {
         const lTokens = [
            makeLToken('<!'),
            makeLToken('ENTITY'),
            makeLToken(' '),
            makeLToken('entityName'),
            makeLToken(' '),
            makeLToken('"'),
            makeLToken('value'),
            makeLToken('"'),
            makeLToken('>'),
         ];
         const value = new text.Token('value', [ lTokens[6] ]);

         expectInputToProduce('<!ENTITY entityName "value">', [
            new entityDeclaration.Token('entityName', [ value ], undefined, '', lTokens),
         ], done);
      });

   });

   describe('entity references', () => {

      it('input to sokens', (done) => {
         expectInputToProduce('&entityRef;', [
            new entityReference.Token('entityRef', [
               makeLToken('&'),
               makeLToken('entityRef'),
               makeLToken(';'),
            ]),
         ], done);
      });

   });

   describe('NOTATIONDECL', () => {

      it('do a simple end to end process', (done) => {
         expectInputToProduce('<!NOTATION myNotation PUBLIC "pub.xml"     "sys.xml" >', [
            new notationDeclaration.Token('myNotation', new EntityLocation('sys.xml', 'pub.xml'), []),
         ], done);
      });

   });

   it('tokenizes a processing instruction', (done) => {
      expectInputToProduce('<?frozboz askfhasdfkh kje  adsf ?>', [
         new processingInstruction.Token('frozboz', 'askfhasdfkh kje  adsf ', []),
      ], done);
   });

   describe('XMLDECL', () => {

      it('tokenized a parsed', (done) => {
         expectInputToProduce('<?xml version="1.0"?>', [
            new xmlDeclaration.Token([ {
               name: 'version',
               value: '1.0',
            } ], [
               makeLToken('<?'),
               makeLToken('xml'),
               makeLToken(' '),
               makeLToken('version'),
               makeLToken('='),
               makeLToken('"'),
               makeLToken('1.0'),
               makeLToken('"'),
               makeLToken('?>'),
            ]) ], done);
      });

   });

});
