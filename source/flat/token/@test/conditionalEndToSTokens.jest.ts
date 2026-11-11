/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ConditionalEndPToken } from 'token';
import { describe, expect, it } from 'vitest';

import { conditionalEndToSTokens } from '../conditionalEndToSTokens';

describe('conditionalEndToSTokens()', () => {
   it('returns all tokens', () => {
      const conditionalEnd = new ConditionalEndPToken({
         open: toSToken(']]>'),
      });

      const sTokens = conditionalEndToSTokens(conditionalEnd);

      expect(sTokens).toEqual([conditionalEnd.open]);
   });
});
