/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { SToken } from '../../sToken/index';

import { EntityReferencePToken } from '../entityReference';
import { GeneralEntityEndPToken, GeneralEntityEndXToken } from '../generalEntityEnd';

describe('GeneralEntityEndPToken (unit)', () => {

   it('is constructed with the specified name', () => {
      const token = new GeneralEntityEndPToken(new EntityReferencePToken());

      expect(token.referencePToken).toEqual(new EntityReferencePToken());
   });

   it('will create an xToken', () => {
      const token = new GeneralEntityEndPToken(new EntityReferencePToken({
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
