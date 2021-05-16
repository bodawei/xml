/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ParameterEntityReferencePToken, UnexpandedMarkupDetails, TextPToken } from 'pToken';
import { toSToken } from 'sToken';

import { parameterEntityReferenceToSTokens } from '../../token/parameterEntityReferenceToSTokens';
import { textToSTokens } from '../../token/textToSTokens';
import { unexpandedToSTokens } from '../unexpandedToSTokens';

jest.mock('../../token/parameterEntityReferenceToSTokens');
jest.mock('../../token/textToSTokens');

describe('unexpandedToSTokens()', () => {
   let unexpanded: UnexpandedMarkupDetails;

   beforeEach(() => {
      unexpanded = { propName: '', tokens: [] };
   });

   it('returns an empty array when no tokens passed in', () => {
      unexpanded.tokens = [];
      const result = unexpandedToSTokens(unexpanded);

      expect(result).toEqual([]);
   });

   it('returns an empty array when no parameter passed in', () => {
      const result = unexpandedToSTokens();

      expect(result).toEqual([]);
   });

   it('extracts the tokens from text tokens', () => {
      (textToSTokens as jest.Mock).mockReturnValue([toSToken('text')]);
      unexpanded.tokens = [
         new TextPToken({ text: toSToken('one') }),
         new TextPToken({ text: toSToken('two') }),
      ];
      const result = unexpandedToSTokens(unexpanded);

      expect(result).toEqual([toSToken('text'), toSToken('text')]);
   });

   it('extracts the tokens from text and a PERef token', () => {
      (textToSTokens as jest.Mock).mockReturnValue([toSToken('text')]);
      (parameterEntityReferenceToSTokens as jest.Mock).mockReturnValue([toSToken('peref')]);
      unexpanded.tokens = [
         new TextPToken({ text: toSToken('one') }),
         new ParameterEntityReferencePToken({ open: toSToken('%') }),
      ];
      const result = unexpandedToSTokens(unexpanded);

      expect(result).toEqual([toSToken('text'), toSToken('peref')]);
   });
});
