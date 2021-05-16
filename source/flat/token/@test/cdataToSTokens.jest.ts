/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { CdataPToken } from 'token';

import { cdataToSTokens } from '../cdataToSTokens';

describe('cdataToSTokens() (unit)', () => {
   it('returns all the STokens', () => {
      const cDataPToken = new CdataPToken({
         open: toSToken('<!['),
         sectionType: toSToken('CDATA'),
         bracket: toSToken('['),
         text: toSToken('test text'),
         close: toSToken(']]>'),
      });

      expect(cdataToSTokens(cDataPToken)).toEqual([
         cDataPToken.open,
         cDataPToken.sectionType!,
         cDataPToken.bracket!,
         cDataPToken.text!,
         cDataPToken.close!,
      ]);
   });
});
