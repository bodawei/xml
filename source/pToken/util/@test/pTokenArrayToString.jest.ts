/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { CharRefPToken, TextPToken } from 'pToken';
import {
   makeGeneralEntityEnd,
   makeGeneralEntityReference,
   makeGeneralEntityStart,
   makeParameterEntityEnd,
   makeParameterEntityReference,
   makeParameterEntityStart,
} from 'token-test';
import { describe, expect, it } from 'vitest';

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
