/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { TextPToken } from 'pToken';
import { LiteralPToken } from 'token';
import { describe, expect, it, vi, type Mock } from 'vitest';

import { literalToSTokens } from '../literalToSTokens';
import { literalValueToSTokens } from '../literalValueToSTokens';

vi.mock('../literalValueToSTokens');

describe('literalToSTokens() (unit)', () => {
   let literalPToken: LiteralPToken;

   beforeEach(() => {
      literalPToken = {
         openQuote: toSToken('"'),
         value: [new TextPToken({ text: toSToken('xxx') })],
         closeQuote: toSToken('"'),
      };

      (literalValueToSTokens as Mock).mockReturnValue(toSToken('xxx'));
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
