/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { TextPToken } from 'pToken';
import { toSToken } from 'basic';
import { LiteralPToken } from 'token';

import { literalValueToSTokens } from '../literalValueToStokens';
import { literalToSTokens } from '../literalToSTokens';

jest.mock('../literalValueToStokens');

describe('literalToSTokens() (unit)', () => {
   let literalPToken: LiteralPToken;

   beforeEach(() => {
      literalPToken = {
         openQuote: toSToken('"'),
         value: [new TextPToken({ text: toSToken('xxx') })],
         closeQuote: toSToken('"'),
      };

      (literalValueToSTokens as jest.Mock).mockReturnValue(toSToken('xxx'));
   });

   it('calls literalValue.getSTokens()', () => {
      literalToSTokens(literalPToken);

      expect(literalValueToSTokens).toHaveBeenCalledWith(literalPToken.value);
   });

   it('does a basic population', () => {
      const results = literalToSTokens(literalPToken);

      expect(results).toEqual([
         literalPToken.openQuote!,
         toSToken('xxx'),
         literalPToken.closeQuote!,
      ]);
   });

   it('adds nothing if the PToken value is undefined', () => {
      const results = literalToSTokens(undefined);

      expect(results).toEqual([]);
   });
});
