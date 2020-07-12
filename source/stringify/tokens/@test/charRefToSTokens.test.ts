/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { toSToken } from 'sToken';
import { CharRefPToken } from 'token';
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
         charRefPToken.openSpace!,
         charRefPToken.hexMarker!,
         charRefPToken.hexMarkerSpace!,
         charRefPToken.digits!,
         charRefPToken.digitsSpace!,
         charRefPToken.close!,
      ]);
   });
});
