/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ConditionalEndPToken } from 'token';
import { describe, expect, it } from 'vitest';

import { ConditionalEndXToken } from '../conditionalEndXToken';

describe('ConditionalClose', () => {
   it('creates an XToken from no ptoken', () => {
      const xToken = new ConditionalEndXToken();

      expect(xToken).toEqual({
         type: 'CONDITIONAL_SECTION_END_XTOKEN',
      });
   });

   it('creates an XToken from a pToken', () => {
      const xToken = new ConditionalEndXToken(new ConditionalEndPToken({ open: toSToken('<![') }));

      expect(xToken).toEqual({
         type: 'CONDITIONAL_SECTION_END_XTOKEN',
         pToken: new ConditionalEndPToken({ open: toSToken('<![') }),
      });
   });
});
