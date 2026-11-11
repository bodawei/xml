/* Copyright ® 2018-20201by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { CharRefPToken } from 'pToken';
import { describe, expect, it } from 'vitest';

import { charRefToSTokens } from '../charRefToSTokens';

describe('charRefToSTokens()', () => {
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
      ]);
   });
});
