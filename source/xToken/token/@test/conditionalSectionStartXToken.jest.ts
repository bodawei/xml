/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';

import { ConditionalSectionStartXToken } from '../conditionalSectionStartXToken';

// ick
import { ConditionalPToken } from 'token';

describe('ConditionalSection', () => {
   it('creates an XToken from no ptoken', () => {
      const xToken = new ConditionalSectionStartXToken();

      expect(xToken).toEqual({
         type: 'CONDITIONAL_SECTION_START_XTOKEN',
      });
   });

   it('creates an XToken from a pToken', () => {
      const xToken = new ConditionalSectionStartXToken(
         new ConditionalPToken({ open: toSToken('<![') }),
      );

      expect(xToken).toEqual({
         type: 'CONDITIONAL_SECTION_START_XTOKEN',
         pToken: new ConditionalPToken({ open: toSToken('<![') }),
      });
   });
});
