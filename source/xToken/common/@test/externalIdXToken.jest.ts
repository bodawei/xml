/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
// ick
import { TextPToken, CharRefPToken, GeneralEntityReferencePToken } from 'token';

import { ExternalIdXToken } from '../externalIdXToken';

describe('ExternalIdXToken', () => {
   it('converts an ExternalId to an ExternalIdXToken', () => {
      const token = new ExternalIdXToken({
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

   it('converts an ExternalId with no public value to an ExternalIdXToken with an undefined public value', () => {
      const token = new ExternalIdXToken({
         externalType: toSToken('SYSTEM'),
         system: {
            value: [
               new TextPToken({ text: toSToken('sys') }),
               new GeneralEntityReferencePToken({
                  open: toSToken('&'),
               }),
               new TextPToken({ text: toSToken('Foo') }),
            ],
         },
      });

      expect(token).toEqual(new ExternalIdXToken('sysFoo', undefined));
   });
});
