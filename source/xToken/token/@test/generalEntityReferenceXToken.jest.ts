/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { GeneralEntityReferencePToken } from 'pToken';
import { describe, expect, it } from 'vitest';

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

      expect(new GeneralEntityReferenceXToken(pePToken)).toEqual({
         type: GENERAL_ENTITY_REFERENCE_XTOKEN,
         name: 'entityName',
         pToken: pePToken,
      });
   });

   it('can pass just a name to the constructor function', () => {
      expect(new GeneralEntityReferenceXToken('foo')).toEqual({
         type: GENERAL_ENTITY_REFERENCE_XTOKEN,
         name: 'foo',
      });
   });
});
