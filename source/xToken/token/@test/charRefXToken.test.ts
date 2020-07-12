/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { CharRefXToken } from '../charRefXToken';
import { CharRefPToken } from 'token';
import { toSToken } from 'sToken';
import { makeCharRef } from 'token-test';

describe('CharRefXToken', () => {
   it('creates an XToken from a charRefPToken', () => {
      const charRefPToken = makeCharRef();
      const xToken = new CharRefXToken(charRefPToken);

      expect(xToken).toEqualProps({
         type: 'CHARREF_XTOKEN',
         char: String.fromCharCode(68),
         pToken: charRefPToken,
      });
   });

   it('creates an XToken when there are no digits i nthe charRef', () => {
      const xToken = new CharRefXToken(
         new CharRefPToken({
            open: toSToken('&#'),
            close: toSToken(';'),
            charCode: 0,
         }),
      );

      expect(xToken).toEqualProps({
         char: '\u0000',
      });
   });

   it('creates an XToken when the digits are hex', () => {
      const xToken = new CharRefXToken(
         new CharRefPToken({
            open: toSToken('&#'),
            hexMarker: toSToken('X'),
            digits: toSToken('41'), // A in hex, ) in decimal
            close: toSToken(';'),
            charCode: 65,
         }),
      );

      expect(xToken).toEqualProps({
         char: 'A',
      });
   });

   it('creates an XToken from an astral plane character', () => {
      const xToken = new CharRefXToken(
         new CharRefPToken({
            open: toSToken('&#'),
            hexMarker: toSToken('X'),
            digits: toSToken('1F026'), // https://codepoints.net/U+1F026
            close: toSToken(';'),
            charCode: 0x1f026,
         }),
      );

      expect(xToken).toEqualProps({
         char: '🀦', // This is actually two entties in the utf8 array.
      });
   });
});
