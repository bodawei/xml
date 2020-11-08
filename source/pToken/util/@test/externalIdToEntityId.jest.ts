/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { externalIdToEntityId } from '../externalIdToEntityId';
// ick
import { TextPToken, CharRefPToken, GeneralEntityReferencePToken } from 'token';

describe('externalIdToEntityId', () => {
   it('converts to an EntityId', () => {
      const token = externalIdToEntityId({
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

      expect(token).toEqual(
         jasmine.objectContaining({
            type: 'ENTITY_ID',
            systemId: 'sysFoo',
            publicId: 'a',
         }),
      );
   });

   it('converts empty values to an EntityId with empty values', () => {
      const token = externalIdToEntityId({
         externalType: toSToken('PUBLIC'),
         system: {
            value: [],
         },
         public: undefined,
      });

      expect(token).toEqual(
         jasmine.objectContaining({
            type: 'ENTITY_ID',
            systemId: '',
            publicId: '',
         }),
      );
   });
});
