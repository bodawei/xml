/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ElementEndPToken } from 'token';
import { describe, expect, it } from 'vitest';

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
