/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { GeneralEntityReferencePToken } from 'pToken';

import { GeneralEntityStartPToken } from '../generalEntityStart';

describe('GeneralEntityStartPToken (unit)', () => {
   it('is constructed with the specified name', () => {
      const token = new GeneralEntityStartPToken(
         new GeneralEntityReferencePToken({ open: toSToken('&') }),
      );

      expect(token.referencePToken).toEqual(
         new GeneralEntityReferencePToken({ open: toSToken('&') }),
      );
   });
});
