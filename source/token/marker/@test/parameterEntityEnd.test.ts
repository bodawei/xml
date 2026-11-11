/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { ParameterEntityReferencePToken } from 'pToken';
import { toSToken } from 'basic';

import { ParameterEntityEndPToken } from '../parameterEntityEnd';

describe('ParameterEntityEndPToken (unit)', () => {
   it('is constructed with the specified name', () => {
      const token = new ParameterEntityEndPToken(
         new ParameterEntityReferencePToken({ open: toSToken('%') }),
      );

      expect(token.referencePToken).toEqual(
         new ParameterEntityReferencePToken({ open: toSToken('%') }),
      );
   });
});
