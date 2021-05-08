/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { CharRefPToken, ParameterEntityReferencePToken, TextPToken } from 'pToken';
import { toSToken } from 'sToken';

import { ParameterEntityReferenceXToken } from '../../token/parameterEntityReferenceXToken';

import { makeEntityValueX } from '../makeEntityValueX';

// ick
import { ParameterEntityEndPToken, ParameterEntityStartPToken } from 'token';

describe('GeneralEntityDeclarationXToken()', () => {
   it('convert an empty literal value to an empty array', () => {
      expect(makeEntityValueX([])).toEqual([]);
   });

   it('convert an text PToken to the corresponding string', () => {
      expect(makeEntityValueX([new TextPToken({ text: toSToken('value') })])).toEqual(['value']);
   });

   it('convert an CharRef PToken to the corresponding string', () => {
      expect(
         makeEntityValueX([new CharRefPToken({ open: toSToken('&#'), digits: toSToken('65') })]),
      ).toEqual(['A']);
   });

   it('convert an ParemeterEntityReference PToken to a ParmaeterEntityReference XToken', () => {
      expect(
         makeEntityValueX([
            new ParameterEntityReferencePToken({ open: toSToken('&'), name: toSToken('Ref1') }),
         ]),
      ).toEqual([
         new ParameterEntityReferenceXToken(
            new ParameterEntityReferencePToken({ open: toSToken('&'), name: toSToken('Ref1') }),
         ),
      ]);
   });

   it('concatenates strings and charrefs', () => {
      expect(
         makeEntityValueX([
            new TextPToken({ text: toSToken('value') }),
            new TextPToken({ text: toSToken('two') }),
            new CharRefPToken({ open: toSToken('&#'), digits: toSToken('65') }),
         ]),
      ).toEqual(['valuetwoA']);
   });

   it('does not concatenate across entity references', () => {
      expect(
         makeEntityValueX([
            new TextPToken({ text: toSToken('value') }),
            new ParameterEntityReferencePToken({ open: toSToken('&'), name: toSToken('Ref1') }),
            new TextPToken({ text: toSToken('two') }),
            new CharRefPToken({ open: toSToken('&#'), digits: toSToken('65') }),
         ]),
      ).toEqual([
         'value',
         new ParameterEntityReferenceXToken(
            new ParameterEntityReferencePToken({ open: toSToken('&'), name: toSToken('Ref1') }),
         ),
         'twoA',
      ]);
   });

   it('does not insert text between two refs', () => {
      expect(
         makeEntityValueX([
            new TextPToken({ text: toSToken('value') }),
            new ParameterEntityReferencePToken({ open: toSToken('&'), name: toSToken('Ref1') }),
            new ParameterEntityReferencePToken({ open: toSToken('&'), name: toSToken('Ref2') }),
            new CharRefPToken({ open: toSToken('&#'), digits: toSToken('65') }),
         ]),
      ).toEqual([
         'value',
         new ParameterEntityReferenceXToken(
            new ParameterEntityReferencePToken({ open: toSToken('&'), name: toSToken('Ref1') }),
         ),
         new ParameterEntityReferenceXToken(
            new ParameterEntityReferencePToken({ open: toSToken('&'), name: toSToken('Ref2') }),
         ),
         'A',
      ]);
   });

   it('ignores other tokens', () => {
      const otherRef = new ParameterEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('Ref0'),
      });
      expect(
         makeEntityValueX([
            new ParameterEntityStartPToken(otherRef),
            new TextPToken({ text: toSToken('three') }),
            new ParameterEntityEndPToken(otherRef),
         ] as any), // TYPEHACK
      ).toEqual(['three']);
   });
});
