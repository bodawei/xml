/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import TokenStream from './TokenStream.js';

describe('TokenStream (unit)', () => {
   let tokenStream;

   beforeEach(() => {
      tokenStream = new TokenStream();
   });

   it('throws an error if asked to deal with an unknown parsed type', () => {
      expect(() => {
         tokenStream._transform({ type: 'BOGUS' }, {}, () => {});
      }).toThrowError('Unknown parsed type "BOGUS" encountered.');
   });

});
