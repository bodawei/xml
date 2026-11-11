/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { CharRefPToken, GeneralEntityReferencePToken, TextPToken } from 'pToken';
import { describe, expect, it } from 'vitest';

import { ExternalIdX, cloneExternalIdX } from '../externalIdX';

describe('ExternalIdX', () => {
   it('converts an ExternalId to an ExternalIdX', () => {
      const token = new ExternalIdX({
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

      expect(token).toEqual(new ExternalIdX('sysFoo', 'a'));
   });

   it('converts an ExternalId with no public value to an ExternalIdX with an undefined public value', () => {
      const token = new ExternalIdX({
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

      expect(token).toEqual(new ExternalIdX('sysFoo', undefined));
   });

   it('cloneExternalIdX() makes a clone of the provided external ID', () => {
      const token = cloneExternalIdX({
         systemId: 'sys',
         publicId: 'pub',
      });

      expect(token).toEqual({
         systemId: 'sys',
         publicId: 'pub',
      });
   });
});
