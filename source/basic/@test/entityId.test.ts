/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ENTITY_ID, EntityId } from '../entityId';

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
});
