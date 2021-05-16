/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { toSToken } from 'sToken';
import { ConditionalClosePToken } from 'token';

import { conditionalEndToSTokens } from '../conditionalEndToSTokens';

describe('conditionalEndToSTokens()', () => {
   it('returns all tokens', () => {
      const conditionalEnd = new ConditionalClosePToken({
         open: toSToken(']]>'),
      });

      const sTokens = conditionalEndToSTokens(conditionalEnd);

      expect(sTokens).toEqual([conditionalEnd.open]);
   });
});
