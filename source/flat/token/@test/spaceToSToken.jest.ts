/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { SpacePToken } from 'token';

import { spaceToSTokens } from '../spaceToSTokens';

describe('spaceToSTokens (unit)', () => {
   it('returns all the STokens', () => {
      const spacePToken = new SpacePToken({
         text: toSToken(' '),
      });

      expect(spaceToSTokens(spacePToken)).toEqual([spacePToken.text]);
   });
});
