/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ParameterEntityReferencePToken } from 'pToken';

import { toSToken } from 'sToken';
import { ConditionalStartPToken } from 'token';

import { conditionalStartToSTokens } from '../conditionalStartToSTokens';
import { parameterEntityReferenceToSTokens } from '../parameterEntityReferenceToSTokens';

jest.mock('../parameterEntityReferenceToSTokens');

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
      (parameterEntityReferenceToSTokens as jest.Mock).mockReturnValue([toSToken('%')]);
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
