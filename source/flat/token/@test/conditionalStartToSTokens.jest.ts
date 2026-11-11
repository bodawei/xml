/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ParameterEntityReferencePToken } from 'pToken';
import { ConditionalStartPToken } from 'token';
import { describe, expect, it, vi, type Mock } from 'vitest';

import { conditionalStartToSTokens } from '../conditionalStartToSTokens';
import { parameterEntityReferenceToSTokens } from '../parameterEntityReferenceToSTokens';

vi.mock('../parameterEntityReferenceToSTokens');

describe('conditionalStartToSTokens()', () => {
   it('returns all tokens', () => {
      const conditionalStart = new ConditionalStartPToken({
         open: toSToken('<![>'),
         openSpace: toSToken(' '),
         sectionType: toSToken('INCLUDE'),
         sectionTypeSpace: toSToken(' '),
         bracket: toSToken('['),
      });

      const sTokens = conditionalStartToSTokens(conditionalStart);

      expect(sTokens).toEqual([
         conditionalStart.open,
         conditionalStart.openSpace,
         conditionalStart.sectionType,
         conditionalStart.sectionTypeSpace,
         conditionalStart.bracket,
      ]);
   });

   it('returns all tokens when there are unexpanded values', () => {
      (parameterEntityReferenceToSTokens as Mock).mockReturnValue([toSToken('%')]);
      const conditionalStart = new ConditionalStartPToken({
         open: toSToken('<![>'),
         openSpace: toSToken(' '),
         unexpanded: {
            peRef: new ParameterEntityReferencePToken({
               open: toSToken('%'),
            }),
            propName: 'wowzers',
         },
      });

      const sTokens = conditionalStartToSTokens(conditionalStart);

      expect(sTokens).toEqual([conditionalStart.open, conditionalStart.openSpace, toSToken('%')]);
   });
});
