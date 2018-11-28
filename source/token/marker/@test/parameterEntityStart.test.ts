/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { SToken } from 'sToken';

import { ParameterEntityReferencePToken } from '../../parameterEntityReference';
import { ParameterEntityStartPToken, ParameterEntityStartXToken } from '../parameterEntityStart';

describe('ParameterEntityStartPToken (unit)', () => {

   it('is constructed with the specified name', () => {
      const token = new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%') }));

      expect(token.referencePToken).toEqual(new ParameterEntityReferencePToken({ open: SToken.fromString('%') }));
   });

   it('will create an xToken', () => {
      const token = new ParameterEntityStartPToken(new ParameterEntityReferencePToken({
         open: SToken.fromString('%'),
         name: SToken.fromString('foo'),
      }));

      expect(token.toXToken()).toEqual(new ParameterEntityStartXToken('foo', token));
   });

});

describe('ParameterEntityStartXToken (unit)', () => {

   it('is constructed with the specified name', () => {
      const token = new ParameterEntityStartXToken('foo');

      expect(token.name).toEqual('foo');
      expect(token.pToken).toBeUndefined();
   });

});
