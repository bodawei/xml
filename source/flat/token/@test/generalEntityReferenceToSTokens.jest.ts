/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { GeneralEntityReferencePToken } from 'pToken';

import { generalEntityReferenceToSTokens } from '../generalEntityReferenceToSTokens';

describe('generalEntityReferenceToSTokens()', () => {
   it('returns all the STokens', () => {
      const gePToken = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         openSpace: toSToken(' '),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         close: toSToken(';'),
      });

      expect(generalEntityReferenceToSTokens(gePToken)).toEqual([
         gePToken.open,
         gePToken.openSpace,
         gePToken.name,
         gePToken.nameSpace,
         gePToken.close,
      ]);
   });
});
