/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { GeneralEntityDeclarationPToken, TextPToken } from 'pToken';
import { describe, expect, it, vi, type Mock } from 'vitest';

import { externalIdToSTokens } from '../../common/externalIdToSTokens';
import { literalToSTokens } from '../../common/literalToSTokens';
import { unexpandedToSTokens } from '../../common/unexpandedToSTokens';
import { generalEntityDeclarationToSTokens } from '../generalEntityDeclarationToSTokens';

vi.mock('../../common/externalIdToSTokens');
vi.mock('../../common/unexpandedToSTokens');
vi.mock('../../common/literalToSTokens');

describe('generalEntityDeclarationToSTokens()', () => {
   beforeEach(() => {
      (externalIdToSTokens as Mock).mockReturnValue([toSToken('externalID')]);
      (unexpandedToSTokens as Mock).mockReturnValue([toSToken('unexpanded')]);
      (literalToSTokens as Mock).mockReturnValue([toSToken('literal')]);
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
