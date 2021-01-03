/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { TextPToken } from 'pToken';
import { toSToken } from 'sToken';
import { CharRefPToken } from 'token';
import {
   makeGeneralEntityEnd,
   makeGeneralEntityReference,
   makeGeneralEntityStart,
   makeParameterEntityEnd,
   makeParameterEntityReference,
   makeParameterEntityStart,
} from 'token-test';

import { attValueToString } from '../attValueToString';

describe('attValueToString (unit)', () => {
   it('returns an empty array as a blank string', () => {
      const result = attValueToString([]);

      expect(result).toEqual('');
   });

   it('converts text and chars to the result but no other types', () => {
      const result = attValueToString([
         new TextPToken({ text: toSToken('fo') }),
         makeGeneralEntityStart(),
         makeGeneralEntityEnd(),
         makeGeneralEntityReference(),
         new CharRefPToken({ open: toSToken('&#'), digits: toSToken('65') }),
         makeParameterEntityStart(),
         makeParameterEntityEnd(),
         makeParameterEntityReference(),
         new TextPToken({ text: toSToken('bar') }),
      ]);

      expect(result).toEqual('foAbar');
   });
});
