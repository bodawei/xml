/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ParsedStream } from '../parse';
import {
   docTypeStart,
   docTypeEnd,
   entityDeclaration,
   xmlDeclaration,
} from '../token';

import TokenStream from './TokenStream.js';

function inputToOutput(inputDocument, tokenArray, done, parsedStream, tokenStream) {
   const results = [];

   function evaluate() {
      expect(results).toEqual(tokenArray);
      done();
   }

   parsedStream.addText(inputDocument);
   parsedStream.endText();

   tokenStream.on('data', (data) => results.push(data));
   tokenStream.on('end', evaluate);
}

describe('TokenStream (integration)', () => {
   let parsedStream;
   let tokenStream;

   beforeEach(() => {
      parsedStream = new ParsedStream();
      tokenStream = new TokenStream();
      parsedStream.pipe(tokenStream);
   });

   describe('XML_DECLARATION', () => {

      it('tokenized a parsed', (done) => {
         inputToOutput('<?xml version="1.0"?>', [
            new xmlDeclaration.Token([ {
               name: 'version',
               value: '1.0',
            } ], []),
         ], done, parsedStream, tokenStream);
      });

   });

   describe('DOCTYPE', () => {

      it('tokenize a parsed', (done) => {
         inputToOutput('<!DOCTYPE one>', [
            new docTypeStart.Token('one', undefined, false, []),
            new docTypeEnd.Token([]),
         ], done, parsedStream, tokenStream);
      });

   });

   describe('ENTITY', () => {

      it('do a simple end to end process', (done) => {
         inputToOutput('<!ENTITY entityName "value">', [
            new entityDeclaration.Token('entityName', 'value', {}, '', []),
         ], done, parsedStream, tokenStream);
      });

   });

});
