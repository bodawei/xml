/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { GeneralEntityReferencePToken } from 'pToken';
import { toSToken } from 'basic';

import { GeneralEntityStartPToken } from '../generalEntityStart';

describe('GeneralEntityStartPToken (unit)', () => {

   it('is constructed with the specified name', () => {
      const token = new GeneralEntityStartPToken(new GeneralEntityReferencePToken({ open: toSToken('&') }));

      expect(token.referencePToken).toEqual(new GeneralEntityReferencePToken({ open: toSToken('&') }));
   });

});
