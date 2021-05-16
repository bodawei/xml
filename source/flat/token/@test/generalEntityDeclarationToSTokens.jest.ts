/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { GeneralEntityDeclarationPToken, TextPToken } from 'pToken';
import { toSToken } from 'sToken';

import { externalIdToSTokens } from '../../common/externalIdToSTokens';
import { unexpandedToSTokens } from '../../common/unexpandedToSTokens';
import { literalToSTokens } from '../../common/literalToSTokens';

import { generalEntityDeclarationToSTokens } from '../generalEntityDeclarationToSTokens';

jest.mock('../../common/externalIdToSTokens');
jest.mock('../../common/unexpandedToSTokens');
jest.mock('../../common/literalToSTokens');

describe('generalEntityDeclarationToSTokens()', () => {
   beforeEach(() => {
      (externalIdToSTokens as jest.Mock).mockReturnValue([toSToken('externalID')]);
      (unexpandedToSTokens as jest.Mock).mockReturnValue([toSToken('unexpanded')]);
      (literalToSTokens as jest.Mock).mockReturnValue([toSToken('literal')]);
   });

   it('returns all the STokens from an general entity declaration with an entity value', () => {
      const pToken = new GeneralEntityDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('ENTITY'),
         declTypeSpace: toSToken(' '),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         openQuote: toSToken('"'),
         value: [new TextPToken({ text: toSToken('x') })],
         closeQuote: toSToken('"'),
         valueSpace: toSToken(' '),
         extra: toSToken('stuff'),
         close: toSToken('>'),
      });

      expect(generalEntityDeclarationToSTokens(pToken)).toEqual([
         pToken.open,
         pToken.openSpace,
         pToken.declType,
         pToken.declTypeSpace,
         pToken.name,
         pToken.nameSpace,
         toSToken('externalID'), // it always calls the function, even if no externalID
         toSToken('literal'), // always calls literal, whether present or not
         pToken.valueSpace,
         toSToken('stuff'),
         pToken.close,
      ]);
   });

   it('returns all the STokens from an general entity declaration with an external ID value', () => {
      const pToken = new GeneralEntityDeclarationPToken({
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
         nData: toSToken('NDATA'),
         nDataSpace: toSToken(' '),
         nDataName: toSToken('foo'),
         nDataNameSpace: toSToken(' '),
         extra: false,
         close: toSToken('>'),
      });

      expect(generalEntityDeclarationToSTokens(pToken)).toEqual([
         pToken.open,
         pToken.openSpace,
         pToken.declType,
         pToken.declTypeSpace,
         pToken.name,
         pToken.nameSpace,
         toSToken('externalID'), // it always calls the function, even if no externalID
         pToken.externalIdSpace,
         pToken.nData,
         pToken.nDataSpace,
         pToken.nDataName,
         pToken.nDataNameSpace,
         toSToken('literal'), // always calls literal, whether present or not
         pToken.close,
      ]);
   });

   it('returns all the STokens from an general entity declaration with an external ID value', () => {
      const pToken = new GeneralEntityDeclarationPToken({
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
         nData: toSToken('NDATA'),
         nDataSpace: toSToken(' '),
         nDataName: toSToken('foo'),
         nDataNameSpace: toSToken(' '),
         unexpanded: {
            propName: 'whatever',
            tokens: [new TextPToken({ text: toSToken('zargle') })],
         },
         close: toSToken('>'),
      });

      expect(generalEntityDeclarationToSTokens(pToken)).toEqual([
         pToken.open,
         pToken.openSpace,
         pToken.declType,
         pToken.declTypeSpace,
         pToken.name,
         pToken.nameSpace,
         toSToken('externalID'), // it always calls the function, even if no externalID
         pToken.externalIdSpace,
         pToken.nData,
         pToken.nDataSpace,
         pToken.nDataName,
         pToken.nDataNameSpace,
         toSToken('literal'), // it always calls the function, even if no externalID
         toSToken('unexpanded'), // it always calls the function, even if no externalID
         pToken.close,
      ]);
   });
});
