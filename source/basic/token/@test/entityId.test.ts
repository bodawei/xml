/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ENTITY_ID, EntityId } from '../entityId';

describe('EntityId', () => {
   it('exports a ENTITY_ID constant', () => {
      expect(ENTITY_ID).toEqual('ENTITY_ID');
   });

   it('exports a EntityId type', () => {
      const token: EntityId = {
         publicId: '- foo -',
         systemId: './index.xml',
         type: ENTITY_ID,
      };

      // This is a lame test.  The core of it really is that
      // we can use the type declaration above without is causing problems.
      expect(token).toEqual(
         jasmine.objectContaining({
            publicId: '- foo -',
            systemId: './index.xml',
            type: 'ENTITY_ID',
         }),
      );
   });

   it('provides a constructor for an EntityId', () => {
      const token = new EntityId('foo', 'bar');

      expect(token).toEqual(
         jasmine.objectContaining({
            publicId: 'bar',
            systemId: 'foo',
            type: 'ENTITY_ID',
         }),
      );
   });
});
