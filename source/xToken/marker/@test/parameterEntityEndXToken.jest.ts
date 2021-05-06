/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ParameterEntityEndPToken } from 'token';
import { ParameterEntityReferencePToken } from 'pToken';
import { toSToken } from 'sToken';

import { PARAMETER_ENTITY_END_XTOKEN, ParameterEntityEndXToken } from '../parameterEntityEndXToken';

describe('ParameterEntityEndXToken (unit)', () => {
   it('will create an xToken', () => {
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

   it('is constructed with the specified name', () => {
      const token = new ParameterEntityEndXToken('foo');

      expect(token.name).toEqual('foo');
      expect(token.pToken).toBeUndefined();
   });
});
