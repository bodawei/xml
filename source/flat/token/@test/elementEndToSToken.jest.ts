/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { ElementEndPToken } from 'token';

import { elementEndToSTokens } from '../elementEndToSTokens';

describe('elementEndToSTokens (unit)', () => {
   it('returns all the STokens', () => {
      const elementEndPToken = new ElementEndPToken({
         open: toSToken('<'),
         openSpace: toSToken(' '),
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         close: toSToken('>'),
      });

      expect(elementEndToSTokens(elementEndPToken)).toEqual([
         elementEndPToken.open,
         elementEndPToken.openSpace!,
         elementEndPToken.name!,
         elementEndPToken.nameSpace!,
         elementEndPToken.close!,
      ]);
   });
});
