/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { CharRefPToken } from 'pToken';
import { makeCharRef } from 'token-test';

import { CharRefXToken } from '../charRefXToken';

describe('CharRefXToken', () => {
   it('creates an XToken from a string', () => {
      const charRefPToken = makeCharRef();
      const xToken = new CharRefXToken(charRefPToken);

      expect(xToken).toEqual({
         type: 'CHARREF_XTOKEN',
         char: String.fromCharCode(68),
         pToken: charRefPToken,
      });
   });

   it('creates an XToken from a charRefPToken', () => {
      const xToken = new CharRefXToken('a');

      expect(xToken).toEqual({
         type: 'CHARREF_XTOKEN',
         char: 'a',
      });
   });

   it('creates an XToken when there are no digits in the charRef', () => {
      const xToken = new CharRefXToken(
         new CharRefPToken({
            open: toSToken('&#'),
            close: toSToken(';'),
            charCode: 0,
         }),
      );

      expect(xToken.char).toEqual('');
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

      expect(xToken.char).toEqual('A');
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

      expect(xToken.char).toEqual('🀦'); // This is actually two entries in the utf8 array.
   });
});
