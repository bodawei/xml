/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Range, EntityLocation } from '../basic';
import { LToken } from '../lToken';
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
            } ], [
               new LToken('<?', '<?', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)),
               new LToken('xml', 'xml', new Range(new EntityLocation(), 2, 0, 2, 5, 0, 5)),
               new LToken(' ', ' ', new Range(new EntityLocation(), 5, 0, 5, 6, 0, 6)),
               new LToken('version', 'version', new Range(new EntityLocation(), 6, 0, 6, 13, 0, 13)),
               new LToken('=', '=', new Range(new EntityLocation(), 13, 0, 13, 14, 0, 14)),
               new LToken('"', '"', new Range(new EntityLocation(), 14, 0, 14, 15, 0, 15)),
               new LToken('1.0', '1.0', new Range(new EntityLocation(), 15, 0, 15, 18, 0, 18)),
               new LToken('"', '"', new Range(new EntityLocation(), 18, 0, 18, 19, 0, 19)),
               new LToken('?>', '?>', new Range(new EntityLocation(), 19, 0, 19, 21, 0, 21)),
            ]) ], done, parsedStream, tokenStream);
      });

   });

   describe('DOCTYPE', () => {

      it('tokenize a parsed', (done) => {
         inputToOutput('<!DOCTYPE one>', [
            new docTypeStart.Token('one', undefined, false, [
               new LToken('<!', '<!', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)),
               new LToken('DOCTYPE', 'DOCTYPE', new Range(new EntityLocation(), 2, 0, 2, 9, 0, 9)),
               new LToken(' ', ' ', new Range(new EntityLocation(), 9, 0, 9, 10, 0, 10)),
               new LToken('one', 'one', new Range(new EntityLocation(), 10, 0, 10, 13, 0, 13)),
            ]),
            new docTypeEnd.Token([
               new LToken('>', '>', new Range(new EntityLocation(), 13, 0, 13, 14, 0, 14)),
            ]),
         ], done, parsedStream, tokenStream);
      });

   });

   describe('ENTITY', () => {

      it('do a simple end to end process', (done) => {
         inputToOutput('<!ENTITY entityName "value">', [
            new entityDeclaration.Token('entityName', 'value', {}, '', [
               new LToken('<!', '<!', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)),
               new LToken('ENTITY', 'ENTITY', new Range(new EntityLocation(), 2, 0, 2, 8, 0, 8)),
               new LToken(' ', ' ', new Range(new EntityLocation(), 8, 0, 8, 9, 0, 9)),
               new LToken('entityName', 'entityName', new Range(new EntityLocation(), 9, 0, 9, 19, 0, 19)),
               new LToken(' ', ' ', new Range(new EntityLocation(), 19, 0, 19, 20, 0, 20)),
               new LToken('"', '"', new Range(new EntityLocation(), 20, 0, 20, 21, 0, 21)),
               new LToken('value', 'value', new Range(new EntityLocation(), 21, 0, 21, 26, 0, 26)),
               new LToken('"', '"', new Range(new EntityLocation(), 26, 0, 26, 27, 0, 27)),
               new LToken('>', '>', new Range(new EntityLocation(), 27, 0, 27, 28, 0, 28)),
            ]),
         ], done, parsedStream, tokenStream);
      });

   });

});
