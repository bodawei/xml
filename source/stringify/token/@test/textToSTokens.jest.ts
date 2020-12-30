/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { TextPToken } from 'pToken';
import { SToken, toSToken } from 'sToken';

import { textToSTokens } from '../textToSTokens';

describe('textToSTokens()', () => {
   it('returns all the STokens', () => {
      const input = new TextPToken({
         text: toSToken('foo'),
      });

      expect(textToSTokens(input)).toEqual([input.text] as Array<SToken>);
   });

   it('returns nothing if the text is somehow, impossibly, undefined', () => {
      const input = new TextPToken({
         text: undefined,
      } as any);

      expect(textToSTokens(input)).toEqual([] as Array<SToken>);
   });
});
