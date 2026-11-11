/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { CharDataPToken } from 'token';
import { describe, expect, it } from 'vitest';

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
