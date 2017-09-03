/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import {
   elementStart,
} from '../xToken';

import TokenStream from './TokenStream.js';

describe('TokenStream (unit)', () => {
   let tokenStream;

   beforeEach(() => {
      tokenStream = new TokenStream();
   });

   it('throws an error if asked to deal with an unknown parsed type', () => {
      tokenStream.write({ type: 'BOGUS' });

      const token = tokenStream.read();

      expect(token.message).toEqual('Unknown parsed type "BOGUS" encountered.');
   });

   it('calls elementStart.makeToken()', () => {
      spyOn(elementStart, 'makeToken');
      const parsed = { type: elementStart.TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(elementStart.makeToken).toHaveBeenCalledWith(parsed);
   });

});
