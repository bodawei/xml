/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { SToken, toSToken } from 'sToken';

import { unexpandedToSTokens } from '../unexpandedToSTokens';

import { ParameterEntityReferencePToken, TextPToken } from 'token'; // ick1
import { UnexpandedDetails } from 'source/pToken/types'; // ick2

describe('unexpandedToSTokens()', () => {
   let unexpanded: UnexpandedDetails;

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
