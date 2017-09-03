/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ParsedStream } from '../parse';
import { xmlDeclaration } from '../token';

import TokenStream from './TokenStream.js';

describe('TokenStream', () => {
   let parsedStream;
   let tokenStream;

   beforeEach(() => {
      parsedStream = new ParsedStream();
      tokenStream = new TokenStream();
      parsedStream.pipe(tokenStream);
   });

   it('lets do it', (done) => {
      const results = [];

      tokenStream.on('data', (data) => {
         results.push(data);
      });
      tokenStream.on('end', () => {
         expect(results).toEqual([
            new xmlDeclaration.Token([ {
               name: 'version',
               value: '1.0',
            } ], []),
         ]);
         done();
      });
      parsedStream.addText('<?xml version="1.0"?>');
      parsedStream.endText();
   });

});
