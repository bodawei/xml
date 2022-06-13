/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { GeneralEntityReferencePToken } from 'pToken';
import { toSToken } from 'basic';

import { GeneralEntityEndPToken } from '../generalEntityEnd';

describe('GeneralEntityEndPToken (unit)', () => {

   it('is constructed with the specified name', () => {
      const token = new GeneralEntityEndPToken(new GeneralEntityReferencePToken({ open: toSToken('&') }));

      expect(token.referencePToken).toEqual(new GeneralEntityReferencePToken({ open: toSToken('&') }));
   });

});
