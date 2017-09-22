/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation } from '../basic';
import { ParsedStream } from '../parse';
import {
   declaration,
   charData,
   comment,
   docTypeStart,
   docTypeEnd,
   entityDeclaration,
   elementEnd,
   elementStart,
   entityReference,
   notationDeclaration,
   processingInstruction,
   space,
   text,
   xmlDeclaration,
} from '../xToken';

import TokenStream from './TokenStream.js';

describe('TokenStream (integration)', () => {
   let parsedStream;
   let tokenStream;

   beforeEach(() => {
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

            actuals[0].lTokens = [];
            if (Array.isArray(actuals[0].value)) {
               actuals[0].value.forEach((element) => {
                  if (element.lTokens) {
                     element.lTokens = [];
                  }
               });
            }

            expect(actuals[0]).toEqual(expected);
         });
         done();
      });
   }

   it('tokenizes an UNKNOWN declaration', (done) => {
      expectInputToProduce('<!BOGUS', [
         new declaration.Token([]),
      ], done);
   });

   it('tokenizes a charData', (done) => {
      expectInputToProduce('some$ text ', new charData.Token('some$ text ', []), done);
   });

   it('tokenizes a comment', (done) => {
      expectInputToProduce('<!--foo-->', new comment.Token('foo', []), done);
   });

   it('tokenizes a DOCTYPE start and end', (done) => {
      expectInputToProduce('<!DOCTYPE one>', [
         new docTypeStart.Token('one', undefined, false, []),
         new docTypeEnd.Token([]),
      ], done);
   });

   it('tokenizes an element start', (done) => {
      expectInputToProduce('<elementName>', [
         new elementStart.Token('elementName', [], []),
      ], done);
   });

   it('tokenizes an element end', (done) => {
      expectInputToProduce('</elementName>', [
         new elementEnd.Token('elementName', []),
      ], done);
   });

   it('tokenizes an ENTITY declaration', (done) => {
      const value = new text.Token('value', []);

      expectInputToProduce('<!ENTITY entityName "value">', [
         new entityDeclaration.Token('entityName', [ value ], undefined, '', []),
      ], done);
   });

   it('tokenizes an entity reference', (done) => {
      expectInputToProduce('&entityRef;', [
         new entityReference.Token('entityRef', []),
      ], done);
   });

   it('nokenizes a NOTATION declaration', (done) => {
      expectInputToProduce('<!NOTATION myNotation PUBLIC "pub.xml"     "sys.xml" >', [
         new notationDeclaration.Token('myNotation', new EntityLocation('sys.xml', 'pub.xml'), []),
      ], done);
   });

   it('tokenizes a processing instruction', (done) => {
      expectInputToProduce('<?frozboz askfhasdfkh kje  adsf ?>', [
         new processingInstruction.Token('frozboz', 'askfhasdfkh kje  adsf ', []),
      ], done);
   });

   it('tokenizes spaces', (done) => {
      expectInputToProduce('<?xml version="1.0"?>   <one></one>', [
         new space.Token('   ', []),
      ], done);
   });

   it('tokenized an Xml Declaration', (done) => {
      expectInputToProduce('<?xml version="1.0"?>', [
         new xmlDeclaration.Token([ {
            name: 'version',
            value: '1.0',
         } ], []) ], done);
   });

});
