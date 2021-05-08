/* Copyright ® 2020-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'sToken';
import { ConditionalPToken } from 'token';

import { ConditionalStartXToken } from '../conditionalStartXToken';

describe('ConditionalSection', () => {
   it('creates an XToken from no ptoken', () => {
      const xToken = new ConditionalStartXToken();

      expect(xToken).toEqual({
         type: 'CONDITIONAL_SECTION_START_XTOKEN',
      });
   });

   it('creates an XToken from a pToken', () => {
      const xToken = new ConditionalStartXToken(new ConditionalPToken({ open: toSToken('<![') }));

      expect(xToken).toEqual({
         type: 'CONDITIONAL_SECTION_START_XTOKEN',
         pToken: new ConditionalPToken({ open: toSToken('<![') }),
      });
   });
});
