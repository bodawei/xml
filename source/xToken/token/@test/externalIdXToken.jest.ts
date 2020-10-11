/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
// ick
import { EXTERNAL_ID, TextPToken, CharRefPToken, GeneralEntityReferencePToken } from 'token';

import { EXTERNAL_ID_XTOKEN, ExternalIdXToken } from '../externalIdXToken';

describe('ExternalIdXToken', () => {
   it('exports a EXTERNAL_ID_XTOKEN constant', () => {
      expect(EXTERNAL_ID_XTOKEN).toEqual('EXTERNAL_ID_XTOKEN');
   });

   it('converts an ExternalId to an ExternalIdXToken', () => {
      const token = new ExternalIdXToken({
         type: EXTERNAL_ID,
         externalType: toSToken('PUBLIC'),
         system: {
            value: [
               new TextPToken({ text: toSToken('sys') }),
               new GeneralEntityReferencePToken({
                  open: toSToken('&'),
               }),
               new TextPToken({ text: toSToken('Foo') }),
            ],
         },
         public: {
            value: [new CharRefPToken({ open: toSToken('&'), digits: toSToken('97') })],
         },
      });

      expect(token).toEqual(new ExternalIdXToken('sysFoo', 'a'));
   });
});
