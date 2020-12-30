import { ParameterEntityDeclarationPToken, TextPToken } from 'pToken';
import { SToken, toSToken } from 'sToken';
import { parameterEntityDeclarationToSTokens } from '../parameterEntityDeclarationToSTokens';

describe('toSTokenArray()', () => {
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
         pToken.openQuote,
         toSToken('x'),
         pToken.closeQuote,
         pToken.valueSpace,
         toSToken('stuff'),
         pToken.close,
      ] as Array<SToken>);
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
         pToken.externalId?.externalType,
         pToken.externalId?.system?.openQuote,
         toSToken('x'),
         pToken.externalId?.system?.closeQuote,
         pToken.externalIdSpace,
         pToken.close,
      ] as Array<SToken>);
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
         pToken.externalId?.externalType,
         pToken.externalId?.system?.openQuote,
         toSToken('x'),
         pToken.externalId?.system?.closeQuote,
         pToken.externalIdSpace,
         toSToken('zargle'),
         pToken.close,
      ] as Array<SToken>);
   });
});
