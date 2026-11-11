/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { SpacePToken } from 'token';
import { describe, expect, it } from 'vitest';

import { spaceToSTokens } from '../spaceToSTokens';

describe('spaceToSTokens (unit)', () => {
   it('returns all the STokens', () => {
      const spacePToken = new SpacePToken({
         text: toSToken(' '),
      });

      expect(spaceToSTokens(spacePToken)).toEqual([spacePToken.text]);
   });
});
