/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { GeneralEntityReferencePToken } from 'pToken';
import { SToken } from 'sToken';

import { GeneralEntityEndPToken, GeneralEntityEndXToken } from '../generalEntityEnd';

describe('GeneralEntityEndPToken (unit)', () => {

   it('is constructed with the specified name', () => {
      const token = new GeneralEntityEndPToken(new GeneralEntityReferencePToken({ open: SToken.fromString('&') }));

      expect(token.referencePToken).toEqual(new GeneralEntityReferencePToken({ open: SToken.fromString('&') }));
   });

   it('will create an xToken', () => {
      const token = new GeneralEntityEndPToken(new GeneralEntityReferencePToken({
         open: SToken.fromString('&'),
         name: SToken.fromString('foo')
      }));

      expect(token.toXToken()).toEqual(new GeneralEntityEndXToken('foo', token));
   });

});

describe('GeneralEntityEndXToken (unit)', () => {

   it('is constructed with the specified name', () => {
      const token = new GeneralEntityEndXToken('foo');

      expect(token.name).toEqual('foo');
      expect(token.pToken).toBeUndefined();
   });

});
