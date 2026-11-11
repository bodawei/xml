/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ElementStartPToken, ElementEmptyPToken } from 'token';
import { describe, expect, it, vi, type Mock } from 'vitest';

import { attributeToSTokens } from '../../common/attributeToSTokens';
import { elementStartToSTokens } from '../elementStartToSTokens';

vi.mock('../../common/attributeToSTokens');

describe('elementStartToSTokens (unit)', () => {
   it('returns all the STokens from an elementStart', () => {
      (attributeToSTokens as Mock).mockReturnValue([toSToken('att'), toSToken('att2')]);
      const elementStartPToken = new ElementStartPToken({
         open: toSToken('<'),
         openSpace: toSToken(' '),
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         attributes: [{}],
         close: toSToken('>'),
      });

      expect(elementStartToSTokens(elementStartPToken)).toEqual([
         elementStartPToken.open,
         elementStartPToken.openSpace,
         elementStartPToken.name,
         elementStartPToken.nameSpace,
         toSToken('att'),
         toSToken('att2'),
         elementStartPToken.close,
      ]);
   });

   it('returns all the STokens in an empty element', () => {
      (attributeToSTokens as Mock).mockReturnValue([]);
      const elementEmptyPToken = new ElementEmptyPToken({
         open: toSToken('<'),
         openSpace: toSToken('\n'),
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         attributes: [],
         close: toSToken('>'),
      });

      const result = elementStartToSTokens(elementEmptyPToken);

      expect(result).toEqual([
         elementEmptyPToken.open,
         elementEmptyPToken.openSpace,
         elementEmptyPToken.name,
         elementEmptyPToken.nameSpace,
         elementEmptyPToken.close,
      ]);
   });
});
