/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ParsedStream } from '../parse';
import { docTypeStart, docTypeEnd, entityDeclaration } from '../token';

import TokenStream from './TokenStream.js';

describe('TokenStream', () => {
   let parsedStream;
   let tokenStream;

   beforeEach(() => {
      parsedStream = new ParsedStream();
      tokenStream = new TokenStream();
      parsedStream.pipe(tokenStream);
   });

   describe('DOCTYPE', () => {

      it('tokenize a parsed', (done) => {
         const results = [];

         function evaluate() {
            expect(results).toEqual([
               new docTypeStart.Token('one', undefined, false, []),
               new docTypeEnd.Token([]),
            ]);

            done();
         }

         parsedStream.addText('<!DOCTYPE one>');
         parsedStream.endText();

         tokenStream.on('data', (data) => results.push(data));
         tokenStream.on('end', evaluate);
      });

   });

   describe('ENTITY declaration', () => {

      it('do a simple end to end process', (done) => {
         const results = [];

         function evaluate() {
            expect(results).toEqual([
               new entityDeclaration.Token('entityName', 'value', {}, '', []),
            ]);

            done();
         }

         parsedStream.addText('<!ENTITY entityName "value">');
         parsedStream.endText();

         tokenStream.on('data', (data) => results.push(data));
         tokenStream.on('end', evaluate);
      });

   });

});
