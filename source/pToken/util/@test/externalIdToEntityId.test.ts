/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { externalIdToEntityId } from '../../util/externalIdToEntityId';
import { EXTERNAL_ID, TextPToken, CharRefPToken, GeneralEntityReferencePToken } from 'token';
import { toSToken } from 'sToken';

describe('externalIdToEntityId', () => {
   it('converts to an EntityId', () => {
      const token = externalIdToEntityId({
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

      expect(token).toEqual(
         jasmine.objectContaining({
            type: 'ENTITY_ID',
            systemId: 'sysFoo',
            publicId: 'a',
         }),
      );
   });
});
