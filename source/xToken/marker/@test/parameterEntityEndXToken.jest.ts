/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { ParameterEntityReferencePToken } from 'pToken';
import { ParameterEntityEndPToken } from 'token';

import { PARAMETER_ENTITY_END_XTOKEN, ParameterEntityEndXToken } from '../parameterEntityEndXToken';

describe('ParameterEntityEndXToken (unit)', () => {
   it('will create an xToken from a PToken', () => {
      const pToken = new ParameterEntityEndPToken(
         new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('foo'),
         }),
      );
      const token = new ParameterEntityEndXToken(pToken);

      expect(token).toEqual({
         type: PARAMETER_ENTITY_END_XTOKEN,
         name: 'foo',
         pToken,
      });
   });

   it('can be constructed with just a name', () => {
      const token = new ParameterEntityEndXToken('foo');

      expect(token.name).toEqual('foo');
      expect(token.pToken).toBeUndefined();
   });
});
