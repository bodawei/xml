/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import {
   CharRefPToken,
   GeneralEntityReferencePToken,
   ParameterEntityReferencePToken,
   TextPToken,
} from 'pToken';
import { GeneralEntityStartPToken } from 'token';

import { charRefToSTokens } from '../../token/charRefToSTokens';
import { generalEntityReferenceToSTokens } from '../../token/generalEntityReferenceToSTokens';
import { parameterEntityReferenceToSTokens } from '../../token/parameterEntityReferenceToSTokens';
import { textToSTokens } from '../../token/textToSTokens';
import { literalValueToSTokens } from '../literalValueToSTokens';

jest.mock('../../token/generalEntityReferenceToSTokens');
jest.mock('../../token/parameterEntityReferenceToSTokens');
jest.mock('../../token/textToSTokens');
jest.mock('../../token/charRefToSTokens');

describe('literalValueToSTokens (unit)', () => {
   it('returns an empty array when passed an empty array', () => {
      const results = literalValueToSTokens([]);

      expect(results).toEqual([]);
   });

   it('returns the result of processing a char ref ptoken', () => {
      (charRefToSTokens as jest.Mock).mockReturnValue([toSToken('char')]);
      const pToken = [new CharRefPToken({ open: toSToken('&#') })];
      const results = literalValueToSTokens(pToken);

      expect(results).toEqual([toSToken('char')]);
   });

   it('returns the result of processing a text ptoken', () => {
      (textToSTokens as jest.Mock).mockReturnValue([toSToken('text')]);
      const pToken = [new TextPToken({ text: toSToken('blah') })];
      const results = literalValueToSTokens(pToken);

      expect(results).toEqual([toSToken('text')]);
   });

   it('adds STokens from a general entity references', () => {
      (generalEntityReferenceToSTokens as jest.Mock).mockReturnValue([toSToken('general')]);
      const pToken = [
         new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('theName'),
         }),
      ];
      const results = literalValueToSTokens(pToken);

      expect(results).toEqual([toSToken('general')]);
   });

   it('adds STokens from a parameter entity references', () => {
      (parameterEntityReferenceToSTokens as jest.Mock).mockReturnValue([toSToken('parameter')]);
      const pToken = [
         new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('theName'),
         }),
      ];
      const results = literalValueToSTokens(pToken);

      expect(results).toEqual([toSToken('parameter')]);
   });

   it('returns an empty array if it encounters a general entity start', () => {
      const pToken = [
         new GeneralEntityStartPToken(
            new GeneralEntityReferencePToken({
               open: toSToken('&'),
               name: toSToken('theName'),
            }),
         ),
      ];
      const results = literalValueToSTokens(pToken);

      expect(results).toEqual([]);
   });
});
