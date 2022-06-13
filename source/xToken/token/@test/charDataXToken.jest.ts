/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { CharDataPToken } from 'token';
import { CHARDATA_XTOKEN, CharDataXToken } from '../charDataXToken';

describe('charDataXToken (unit)', () => {
   it('constructs from a text value', () => {
      const result = new CharDataXToken('foo');

      expect(result).toEqual({
         type: CHARDATA_XTOKEN,
         text: 'foo',
      });
   });

   it('constructs from a CharDataXToken value', () => {
      const result = new CharDataXToken(
         new CharDataPToken({
            text: toSToken('test text'),
         }),
      );

      expect(result).toEqual({
         type: CHARDATA_XTOKEN,
         text: 'test text',
         pToken: new CharDataPToken({
            text: toSToken('test text'),
         }),
      });
   });
});
