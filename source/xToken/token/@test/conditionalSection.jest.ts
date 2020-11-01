/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';

import { ConditionalXToken } from '../conditionalSection';

// ick
import { ConditionalPToken } from 'token';

describe('ConditionalSection', () => {
   it('creates an XToken from no ptoken', () => {
      const xToken = new ConditionalXToken();

      expect(xToken).toEqual({
         type: 'CONDITIONAL_XTOKEN',
      });
   });

   it('creates an XToken from a pToken', () => {
      const xToken = new ConditionalXToken(new ConditionalPToken({ open: toSToken('<![') }));

      expect(xToken).toEqual({
         type: 'CONDITIONAL_XTOKEN',
         pToken: new ConditionalPToken({ open: toSToken('<![') }),
      });
   });
});
