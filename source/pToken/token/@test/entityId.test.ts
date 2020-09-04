/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ENTITY_ID, EntityId, externalIdToEntityId } from '../entityId';
import { EXTERNAL_ID, TextPToken, CharRefPToken, GeneralEntityReferencePToken } from 'token';
import { toSToken } from 'sToken';

describe('EntityId', () => {
   it('exports a ENTITY_ID constant', () => {
      expect(ENTITY_ID).toEqual('ENTITY_ID');
   });

   it('exports a EntityId type', () => {
      const token: EntityId = {
         type: ENTITY_ID,
         systemId: './index.xml',
         publicId: '- foo -',
      };

      // This is a lame test.  The core of it really is that
      // we can use the type declaration above without is causing problems.
      expect(token).toEqual(
         jasmine.objectContaining({
            type: 'ENTITY_ID',
            systemId: './index.xml',
            publicId: '- foo -',
         }),
      );
   });

   it('provides a constructor for an EntityId', () => {
      const token = new EntityId('foo', 'bar');

      expect(token).toEqual(
         jasmine.objectContaining({
            type: 'ENTITY_ID',
            systemId: 'foo',
            publicId: 'bar',
         }),
      );
   });

   it('provides a function to convert an ExternalId to an EntityId', () => {
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
