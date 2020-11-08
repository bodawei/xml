/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';

import { ConditionalSectionEndXToken } from '../conditionalSectionEndXToken';

// ick
import { ConditionalClosePToken } from 'token';

describe('ConditionalClose', () => {
   it('creates an XToken from no ptoken', () => {
      const xToken = new ConditionalSectionEndXToken();

      expect(xToken).toEqual({
         type: 'CONDITIONAL_SECTION_END_XTOKEN',
      });
   });

   it('creates an XToken from a pToken', () => {
      const xToken = new ConditionalSectionEndXToken(
         new ConditionalClosePToken({ open: toSToken('<![') }),
      );

      expect(xToken).toEqual({
         type: 'CONDITIONAL_SECTION_END_XTOKEN',
         pToken: new ConditionalClosePToken({ open: toSToken('<![') }),
      });
   });
});
