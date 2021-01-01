/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { GeneralEntityDeclarationPToken, TextPToken } from 'pToken';
import { SToken, toSToken } from 'sToken';

import { generalEntityDeclarationToSTokens } from '../generalEntityDeclarationToSTokens';

describe('toSTokenArray()', () => {
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
         pToken.openQuote,
         toSToken('x'),
         pToken.closeQuote,
         pToken.valueSpace,
         toSToken('stuff'),
         pToken.close,
      ] as Array<SToken>);
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
         pToken.externalId?.externalType,
         pToken.externalId?.system?.openQuote,
         toSToken('x'),
         pToken.externalId?.system?.closeQuote,
         pToken.externalIdSpace,
         pToken.nData,
         pToken.nDataSpace,
         pToken.nDataName,
         pToken.nDataNameSpace,
         pToken.close,
      ] as Array<SToken>);
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
         pToken.externalId?.externalType,
         pToken.externalId?.system?.openQuote,
         toSToken('x'),
         pToken.externalId?.system?.closeQuote,
         pToken.externalIdSpace,
         pToken.nData,
         pToken.nDataSpace,
         pToken.nDataName,
         pToken.nDataNameSpace,
         toSToken('zargle'),
         pToken.close,
      ] as Array<SToken>);
   });
});
