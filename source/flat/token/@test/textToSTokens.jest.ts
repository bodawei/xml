/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { TextPToken } from 'pToken';
import { toSToken } from 'sToken';

import { textToSTokens } from '../textToSTokens';

describe('textToSTokens()', () => {
   it('returns all the STokens', () => {
      const input = new TextPToken({
         text: toSToken('foo'),
      });

      expect(textToSTokens(input)).toEqual([input.text]);
   });
});
