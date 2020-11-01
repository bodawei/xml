/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';

import { ConditionalCloseXToken } from '../conditionalClose';

// ick
import { ConditionalClosePToken } from 'token';

describe('ConditionalClose', () => {
   it('creates an XToken from no ptoken', () => {
      const xToken = new ConditionalCloseXToken();

      expect(xToken).toEqual({
         type: 'CONDITIONAL_CLOSE_XTOKEN',
      });
   });

   it('creates an XToken from a pToken', () => {
      const xToken = new ConditionalCloseXToken(
         new ConditionalClosePToken({ open: toSToken('<![') }),
      );

      expect(xToken).toEqual({
         type: 'CONDITIONAL_CLOSE_XTOKEN',
         pToken: new ConditionalClosePToken({ open: toSToken('<![') }),
      });
   });
});
