/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { CdataPToken } from 'token';
import { CDATA_XTOKEN, CdataXToken } from '../cdataXToken';

describe('cdataXToken (unit)', () => {
   it('constructs from a text value', () => {
      const result = new CdataXToken('foo');

      expect(result).toEqual({
         type: CDATA_XTOKEN,
         text: 'foo',
      });
   });

   it('constructs from a CDataPToken value', () => {
      const result = new CdataXToken(
         new CdataPToken({
            open: toSToken('<!['),
            sectionType: toSToken('CDATA'),
            bracket: toSToken('['),
            text: toSToken('test text'),
            close: toSToken(']]>'),
         }),
      );

      expect(result).toEqual({
         type: CDATA_XTOKEN,
         text: 'test text',
         pToken: new CdataPToken({
            open: toSToken('<!['),
            sectionType: toSToken('CDATA'),
            bracket: toSToken('['),
            text: toSToken('test text'),
            close: toSToken(']]>'),
         }),
      });
   });
});
