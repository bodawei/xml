/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { CharRefPToken } from 'pToken';
import { SToken, toSToken } from 'sToken';

import { charRefToSTokens } from '../charRefToSTokens';

describe('sTokensFromPToken()', () => {
   it('returns all tokens', () => {
      const charRefPToken = new CharRefPToken({
         open: toSToken('&#'),
         openSpace: toSToken(' '),
         hexMarker: toSToken('x'),
         hexMarkerSpace: toSToken(' '),
         digits: toSToken('123'),
         digitsSpace: toSToken(' '),
         close: toSToken(';'),
      });

      const sTokens = charRefToSTokens(charRefPToken);

      expect(sTokens).toEqual([
         charRefPToken.open,
         charRefPToken.openSpace,
         charRefPToken.hexMarker,
         charRefPToken.hexMarkerSpace,
         charRefPToken.digits,
         charRefPToken.digitsSpace,
         charRefPToken.close,
      ] as Array<SToken>);
   });
});
