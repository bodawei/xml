/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ParameterEntityReferencePToken } from 'pToken';
import { toSToken } from 'basic';

import {
   PARAMETER_ENTITY_REFERENCE_XTOKEN,
   ParameterEntityReferenceXToken,
} from '../parameterEntityReferenceXToken';

describe('ParameterEntityReferenceXToken', () => {
   it('returns a ParameterEntityReferenceXToken when constructed with a string', () => {
      const token = new ParameterEntityReferenceXToken('entityName');

      expect(token.name).toEqual('entityName');
   });

   it('returns an entity reference token with a blank name when the name could not be found', () => {
      const pePToken = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         close: toSToken(';'),
      });

      const token = new ParameterEntityReferenceXToken(pePToken);

      expect(token.name).toEqual('');
   });

   it('returns an entity reference token populated from a PToken', () => {
      const pePToken = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         openSpace: toSToken('   '),
         name: toSToken('testing'),
         nameSpace: toSToken('   '),
         close: toSToken(';'),
      });

      const token = new ParameterEntityReferenceXToken(pePToken);

      expect(token).toEqual({
         type: PARAMETER_ENTITY_REFERENCE_XTOKEN,
         name: 'testing',
         pToken: pePToken,
      });
   });
});
