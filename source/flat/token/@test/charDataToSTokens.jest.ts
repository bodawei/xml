/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { CharDataPToken } from 'token';

import { charDataToSTokens } from '../charDataToSTokens';

describe('charDataToSTokens()', () => {
   it('returns all tokens', () => {
      const charDataPToken = new CharDataPToken({
         text: toSToken('foo'),
      });

      const sTokens = charDataToSTokens(charDataPToken);

      expect(sTokens).toEqual([charDataPToken.text]);
   });
});
