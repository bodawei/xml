/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { GeneralEntityReferencePToken } from 'token';

import {
   GeneralEntityReferenceXToken,
   GENERAL_ENTITY_REFERENCE_XTOKEN,
} from '../generalEntityReferenceXToken';

describe('ParameterEntityReferenceXToken()', () => {
   it('accepts a pToken as a constructor parameter', () => {
      const pePToken = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         openSpace: toSToken(' '),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         close: toSToken(';'),
      });

      expect(new GeneralEntityReferenceXToken(pePToken)).toEqualProps({
         type: GENERAL_ENTITY_REFERENCE_XTOKEN,
         name: 'entityName',
         pToken: pePToken,
      });
   });

   it('can pass just a name to the constructor function', () => {
      expect(new GeneralEntityReferenceXToken('foo')).toEqualProps({
         type: GENERAL_ENTITY_REFERENCE_XTOKEN,
         name: 'foo',
      });
   });
});
