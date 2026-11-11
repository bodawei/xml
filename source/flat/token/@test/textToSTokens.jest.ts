/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { TextPToken } from 'pToken';
import { describe, expect, it } from 'vitest';

import { textToSTokens } from '../textToSTokens';

describe('textToSTokens()', () => {
   it('returns all the STokens', () => {
      const input = new TextPToken({
         text: toSToken('foo'),
      });

      expect(textToSTokens(input)).toEqual([input.text]);
   });
});
