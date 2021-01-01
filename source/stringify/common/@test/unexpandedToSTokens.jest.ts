/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { UnexpandedMarkupDetails, TextPToken } from 'pToken';
import { SToken, toSToken } from 'sToken';
// ick1
import { ParameterEntityReferencePToken } from 'token';

import { unexpandedToSTokens } from '../unexpandedToSTokens';

describe('unexpandedToSTokens()', () => {
   let unexpanded: UnexpandedMarkupDetails;

   beforeEach(() => {
      unexpanded = { propName: '', tokens: [] };
   });

   it('returns an empty array when no tokens passed in', () => {
      unexpanded.tokens = [];
      const result = unexpandedToSTokens(unexpanded);

      expect(result).toEqual([] as Array<SToken>);
   });

   it('returns an empty array when no parameter passed in', () => {
      const result = unexpandedToSTokens();

      expect(result).toEqual([] as Array<SToken>);
   });

   it('extracts the tokens from text tokens', () => {
      unexpanded.tokens = [
         new TextPToken({ text: toSToken('one') }),
         new TextPToken({ text: toSToken('two') }),
      ];
      const result = unexpandedToSTokens(unexpanded);

      expect(result).toEqual([toSToken('one'), toSToken('two')] as Array<SToken>);
   });

   it('extracts the tokens from text and a PERef token', () => {
      unexpanded.tokens = [
         new TextPToken({ text: toSToken('one') }),
         new ParameterEntityReferencePToken({ open: toSToken('%') }),
      ];
      const result = unexpandedToSTokens(unexpanded);

      expect(result).toEqual([toSToken('one'), toSToken('%')] as Array<SToken>);
   });
});
