/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { ParameterEntityDeclarationPToken, TextPToken } from 'pToken';

import { externalIdToSTokens } from '../../common/externalIdToSTokens';
import { literalToSTokens } from '../../common/literalToSTokens';
import { unexpandedToSTokens } from '../../common/unexpandedToSTokens';
import { parameterEntityDeclarationToSTokens } from '../parameterEntityDeclarationToSTokens';

jest.mock('../../common/externalIdToSTokens');
jest.mock('../../common/unexpandedToSTokens');
jest.mock('../../common/literalToSTokens');

describe('parameterEntityDeclarationToSTokens()', () => {
   beforeEach(() => {
      (externalIdToSTokens as jest.Mock).mockReturnValue([toSToken('externalID')]);
      (unexpandedToSTokens as jest.Mock).mockReturnValue([toSToken('unexpanded')]);
      (literalToSTokens as jest.Mock).mockReturnValue([toSToken('literal')]);
   });
   it('returns all the STokens from an parameter entity declaration with an entity value', () => {
      const pToken = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('ENTITY'),
         declTypeSpace: toSToken(' '),
         parameter: toSToken('%'),
         parameterSpace: toSToken(' '),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         openQuote: toSToken('"'),
         value: [new TextPToken({ text: toSToken('x') })],
         closeQuote: toSToken('"'),
         valueSpace: toSToken(' '),
         extra: toSToken('stuff'),
         close: toSToken('>'),
      });

      expect(parameterEntityDeclarationToSTokens(pToken)).toEqual([
         pToken.open,
         pToken.openSpace,
         pToken.declType,
         pToken.declTypeSpace,
         pToken.parameter,
         pToken.parameterSpace,
         pToken.name,
         pToken.nameSpace,
         toSToken('externalID'),
         toSToken('literal'),
         pToken.valueSpace,
         toSToken('stuff'),
         pToken.close,
      ]);
   });

   it('returns all the STokens from an parameter entity declaration with an external ID value', () => {
      const pToken = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('ENTITY'),
         declTypeSpace: toSToken(' '),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         externalId: {
            externalType: toSToken('SYSTEM'),
            system: {
               openQuote: toSToken('"'),
               value: [new TextPToken({ text: toSToken('x') })],
               closeQuote: toSToken('"'),
            },
         },
         externalIdSpace: toSToken(' '),
         extra: false,
         close: toSToken('>'),
      });

      expect(parameterEntityDeclarationToSTokens(pToken)).toEqual([
         pToken.open,
         pToken.openSpace,
         pToken.declType,
         pToken.declTypeSpace,
         pToken.name,
         pToken.nameSpace,
         toSToken('externalID'),
         pToken.externalIdSpace,
         toSToken('literal'),
         pToken.close,
      ]);
   });

   it('returns all the STokens from an parameter entity declaration with an external ID value', () => {
      const pToken = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('ENTITY'),
         declTypeSpace: toSToken(' '),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         externalId: {
            externalType: toSToken('SYSTEM'),
            system: {
               openQuote: toSToken('"'),
               value: [new TextPToken({ text: toSToken('x') })],
               closeQuote: toSToken('"'),
            },
         },
         externalIdSpace: toSToken(' '),
         unexpanded: {
            propName: 'whatever',
            tokens: [new TextPToken({ text: toSToken('zargle') })],
         },
         close: toSToken('>'),
      });

      expect(parameterEntityDeclarationToSTokens(pToken)).toEqual([
         pToken.open,
         pToken.openSpace,
         pToken.declType,
         pToken.declTypeSpace,
         pToken.name,
         pToken.nameSpace,
         toSToken('externalID'),
         pToken.externalIdSpace,
         toSToken('literal'),
         toSToken('unexpanded'),
         pToken.close,
      ]);
   });
});
