/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import {
   charData,
   elementEnd,
   elementStart,
   entityReference,
} from '../xToken';

import TokenStream from './TokenStream.js';

describe('TokenStream (unit)', () => {
   let tokenStream;

   beforeEach(() => {
      tokenStream = new TokenStream();
   });

   it('calls charData.makeToken()', () => {
      spyOn(charData, 'makeToken');
      const parsed = { type: charData.TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(charData.makeToken).toHaveBeenCalledWith(parsed);
   });

   it('calls elementStart.makeToken()', () => {
      spyOn(elementStart, 'makeToken');
      const parsed = { type: elementStart.TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(elementStart.makeToken).toHaveBeenCalledWith(parsed);
   });

   it('calls elementEnd.makeToken()', () => {
      spyOn(elementEnd, 'makeToken');
      const parsed = { type: elementEnd.TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(elementEnd.makeToken).toHaveBeenCalledWith(parsed);
   });

   it('calls entityReference.makeToken()', () => {
      spyOn(entityReference, 'makeToken');
      const parsed = { type: entityReference.TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(entityReference.makeToken).toHaveBeenCalledWith(parsed);
   });

   it('throws an error if asked to deal with an unknown parsed type', () => {
      tokenStream.write({ type: 'BOGUS' });

      const token = tokenStream.read();

      expect(token.message).toEqual('Unknown parsed type "BOGUS" encountered.');
   });

});
