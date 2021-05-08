/* Copyright ® 2020-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'sToken';
import { ConditionalClosePToken } from 'token';

import { ConditionalEndXToken } from '../conditionalEndXToken';

describe('ConditionalClose', () => {
   it('creates an XToken from no ptoken', () => {
      const xToken = new ConditionalEndXToken();

      expect(xToken).toEqual({
         type: 'CONDITIONAL_SECTION_END_XTOKEN',
      });
   });

   it('creates an XToken from a pToken', () => {
      const xToken = new ConditionalEndXToken(
         new ConditionalClosePToken({ open: toSToken('<![') }),
      );

      expect(xToken).toEqual({
         type: 'CONDITIONAL_SECTION_END_XTOKEN',
         pToken: new ConditionalClosePToken({ open: toSToken('<![') }),
      });
   });
});
