/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { CharRefPToken, TextPToken } from 'pToken';
import { toSToken } from 'sToken';

import { lookupPredefinedEntityValue } from '../lookupPredefinedEntityValue';

describe('lookupPredefinedEntityValue() (unit)', () => {
   it('returns no value if not given one of the predefined entity name', () => {
      const result = lookupPredefinedEntityValue('foo');

      expect(result).toBeUndefined();
   });

   it('returns a value if given "lt"', () => {
      const result = lookupPredefinedEntityValue('lt');

      expect(result).toEqual([
         new CharRefPToken({
            open: toSToken('&#'),
            digits: toSToken('38'),
            close: toSToken(';'),
         }),
         new TextPToken({ text: toSToken('#60;') }),
      ]);
   });

   it('returns a value if given "amp"', () => {
      const result = lookupPredefinedEntityValue('amp');

      expect(result).toEqual([
         new CharRefPToken({
            open: toSToken('&#'),
            digits: toSToken('38'),
            close: toSToken(';'),
         }),
         new TextPToken({ text: toSToken('#38;') }),
      ]);
   });

   it('returns a value if given "gt"', () => {
      const result = lookupPredefinedEntityValue('gt');

      expect(result).toEqual([
         new CharRefPToken({
            open: toSToken('&#'),
            digits: toSToken('62'),
            close: toSToken(';'),
         }),
      ]);
   });

   it('returns a value if given "apos"', () => {
      const result = lookupPredefinedEntityValue('apos');

      expect(result).toEqual([
         new CharRefPToken({
            open: toSToken('&#'),
            digits: toSToken('39'),
            close: toSToken(';'),
         }),
      ]);
   });

   it('returns a value if given "quot"', () => {
      const result = lookupPredefinedEntityValue('quot');

      expect(result).toEqual([
         new CharRefPToken({
            open: toSToken('&#'),
            digits: toSToken('34'),
            close: toSToken(';'),
         }),
      ]);
   });
});
