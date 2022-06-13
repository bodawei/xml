/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { GeneralEntityReferencePToken } from 'pToken';
import { toSToken } from 'basic';
import { GeneralEntityEndPToken } from 'token';

import { GeneralEntityEndXToken } from '../generalEntityEndXToken';

describe('GeneralEntityEndXToken (unit)', () => {
   it('is constructed with the specified name', () => {
      const token = new GeneralEntityEndXToken('foo');

      expect(token.name).toEqual('foo');
      expect(token.pToken).toBeUndefined();
   });

   it('is constructed from a PToken', () => {
      const ref = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('refName'),
      });
      const pToken = new GeneralEntityEndPToken(ref);
      const token = new GeneralEntityEndXToken(pToken);

      expect(token.name).toEqual('refName');
      expect(token.pToken).toEqual(pToken);
   });
});
