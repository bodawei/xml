/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { SToken } from 'sToken';

import { GeneralEntityReferencePToken } from '../../generalEntityReference';
import { GeneralEntityStartPToken, GeneralEntityStartXToken } from '../generalEntityStart';

describe('GeneralEntityStartPToken (unit)', () => {

   it('is constructed with the specified name', () => {
      const token = new GeneralEntityStartPToken(new GeneralEntityReferencePToken({ open: SToken.fromString('&') }));

      expect(token.referencePToken).toEqual(new GeneralEntityReferencePToken({ open: SToken.fromString('&') }));
   });

   it('will create an xToken', () => {
      const token = new GeneralEntityStartPToken(new GeneralEntityReferencePToken({
         open: SToken.fromString('&'),
         name: SToken.fromString('foo')
      }));

      expect(token.toXToken()).toEqual(new GeneralEntityStartXToken('foo', token));
   });

});

describe('GeneralEntityStartXToken (unit)', () => {

   it('is constructed with the specified name', () => {
      const token = new GeneralEntityStartXToken('foo');

      expect(token.name).toEqual('foo');
      expect(token.pToken).toBeUndefined();
   });

});
