/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { makeLTokenMaker } from '../lToken/test';
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

   describe('XMLDECL', () => {

      it('tokenized a parsed', (done) => {
         const makeLToken = makeLTokenMaker();
         inputToOutput('<?xml version="1.0"?>', [
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
            ]) ], done, parsedStream, tokenStream);
      });

   });

   describe('DOCTYPE', () => {

      it('tokenize a parsed', (done) => {
         const makeLToken = makeLTokenMaker();
         inputToOutput('<!DOCTYPE one>', [
            new docTypeStart.Token('one', undefined, false, [
               makeLToken('<!'),
               makeLToken('DOCTYPE'),
               makeLToken(' '),
               makeLToken('one'),
            ]),
            new docTypeEnd.Token([
               makeLToken('>'),
            ]),
         ], done, parsedStream, tokenStream);
      });

   });

   describe('ENTITY', () => {

      it('do a simple end to end process', (done) => {
         const makeLToken = makeLTokenMaker();
         inputToOutput('<!ENTITY entityName "value">', [
            new entityDeclaration.Token('entityName', 'value', {}, '', [
               makeLToken('<!'),
               makeLToken('ENTITY'),
               makeLToken(' '),
               makeLToken('entityName'),
               makeLToken(' '),
               makeLToken('"'),
               makeLToken('value'),
               makeLToken('"'),
               makeLToken('>'),
            ]),
         ], done, parsedStream, tokenStream);
      });

   });

});
