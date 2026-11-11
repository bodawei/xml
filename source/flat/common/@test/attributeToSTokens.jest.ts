/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { AttributePToken } from 'token';
import { vi, type Mock } from 'vitest';

import { attributeToSTokens } from '../attributeToSTokens';
import { literalToSTokens } from '../literalToSTokens';

vi.mock('../literalToSTokens');

describe('attribute (unit)', () => {
   let attributesPChunk: Array<AttributePToken>;

   beforeEach(() => {
      attributesPChunk = [
         {
            name: toSToken('version'),
            postNameSpace: toSToken(' '),
            equal: toSToken('='),
            postEqualSpace: toSToken(' '),
            value: [],
            trailingSpace: toSToken(' '),
         },
         {
            name: toSToken('another'),
            postNameSpace: undefined,
            equal: toSToken('='),
            postEqualSpace: undefined,
            value: [],
            trailingSpace: undefined,
         },
      ];
      (literalToSTokens as Mock).mockReturnValue([toSToken('literal')]);
   });

   it('calls literalToSTokens()', () => {
      attributesPChunk.pop();

      attributeToSTokens(attributesPChunk);

      expect(literalToSTokens).toHaveBeenCalledWith(attributesPChunk[0]);
   });

   it('returns the STokens that made up the attribute', () => {
      const results = attributeToSTokens(attributesPChunk);

      expect(results).toEqual([
         attributesPChunk[0].name,
         attributesPChunk[0].postNameSpace!,
         attributesPChunk[0].equal!,
         attributesPChunk[0].postEqualSpace!,
         toSToken('literal'),
         attributesPChunk[0].trailingSpace!,
         attributesPChunk[1].name,
         attributesPChunk[1].equal!,
         toSToken('literal'),
      ]);
   });

   it('handles most attributes properties being missing', () => {
      const results = attributeToSTokens([
         {
            name: toSToken('outch'),
            value: [],
         },
      ]);

      expect(results).toEqual([toSToken('outch'), toSToken('literal')]);
   });

   it('returns an empty array if no attributes are passed', () => {
      const results = attributeToSTokens(undefined);

      expect(results).toEqual([]);
   });
});
