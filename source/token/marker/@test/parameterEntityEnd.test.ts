/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { SToken } from 'sToken';

import { ParameterEntityReferencePToken } from '../../parameterEntityReference';
import { ParameterEntityEndPToken, ParameterEntityEndXToken } from '../parameterEntityEnd';

describe('ParameterEntityEndPToken (unit)', () => {

   it('is constructed with the specified name', () => {
      const token = new ParameterEntityEndPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), }));

      expect(token.referencePToken).toEqual(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), }));
   });

   it('will create an xToken', () => {
      const token = new ParameterEntityEndPToken(new ParameterEntityReferencePToken({
         open: SToken.fromString('%'),
         name: SToken.fromString('foo'),
      }));

      expect(token.toXToken()).toEqual(new ParameterEntityEndXToken('foo', token));
   });

});

describe('ParameterEntityEndXToken (unit)', () => {

   it('is constructed with the specified name', () => {
      const token = new ParameterEntityEndXToken('foo');

      expect(token.name).toEqual('foo');
      expect(token.pToken).toBeUndefined();
   });

});
