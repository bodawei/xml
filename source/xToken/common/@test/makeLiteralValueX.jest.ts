/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { TextPToken } from 'pToken';
import { SToken } from 'sToken';
import { TextXToken } from 'xToken';

import { makeLiteralValueX } from '../makeLiteralValueX';

describe('makeLiteralValueX (unit)', () => {
   it('returns a Text token from the PToken result', () => {
      const pToken = [new TextPToken({ text: SToken.fromString('blah') })];
      const result = makeLiteralValueX(pToken);

      expect(result).toEqual([new TextXToken(pToken[0])]);
   });

   // it('calls reference.toXToken for each reference in the pToken value', () => {
   //    const geReference = new GeneralEntityReferencePToken({ open: SToken.fromString('&') });
   //    const refSpy = spyOn(geReference, 'toXToken');
   //    const pToken = [new TextPToken({ text: SToken.fromString('blah') }), geReference];
   //    makeLiteralValueX(pToken);

   //    expect(refSpy.calls.count()).toEqual(1);
   //    expect(refSpy.calls.argsFor(0)).toEqual([]);
   // });

   it('copes with no values at all', () => {
      const result = makeLiteralValueX([]);

      expect(result).toEqual([]);
   });
});
