/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { CharRefPToken, TextPToken } from 'pToken';
import { toSToken } from 'basic';
import {
   makeGeneralEntityEnd,
   makeGeneralEntityReference,
   makeGeneralEntityStart,
   makeParameterEntityEnd,
   makeParameterEntityReference,
   makeParameterEntityStart,
} from 'token-test';

import { pTokenArrayToString } from '../pTokenArrayToString';

describe('pTokenArrayToString (unit)', () => {
   it('returns an empty array as a blank string', () => {
      const result = pTokenArrayToString([]);

      expect(result).toEqual('');
   });

   it('converts text and chars to the result but no other types', () => {
      const result = pTokenArrayToString([
         new TextPToken({ text: toSToken('fo') }),
         makeGeneralEntityStart(),
         makeGeneralEntityEnd(),
         makeGeneralEntityReference(),
         new CharRefPToken({ open: toSToken('&#'), digits: toSToken('65') }),
         makeParameterEntityStart(),
         makeParameterEntityEnd(),
         makeParameterEntityReference(),
         new TextPToken({ text: toSToken('bar') }),
         new TextPToken({ text: toSToken('   ') }),
      ]);

      expect(result).toEqual('foAbar   ');
   });
});
