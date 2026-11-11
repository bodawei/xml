/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { ParameterEntityReferencePToken } from 'pToken';
import { ParameterEntityStartPToken } from 'token';

import {
   PARAMETER_ENTITY_START_XTOKEN,
   ParameterEntityStartXToken,
} from '../parameterEntityStartXToken';

describe('ParameterEntityStartXToken (unit)', () => {
   it('will create an xToken', () => {
      const pToken = new ParameterEntityStartPToken(
         new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('foo'),
         }),
      );
      const token = new ParameterEntityStartXToken(pToken);

      expect(token).toEqual({
         type: PARAMETER_ENTITY_START_XTOKEN,
         name: 'foo',
         pToken,
      });
   });

   it('can be constructed with just a name', () => {
      const token = new ParameterEntityStartXToken('foo');

      expect(token.name).toEqual('foo');
      expect(token.pToken).toBeUndefined();
   });
});
