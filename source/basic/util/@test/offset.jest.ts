/* Copyright ® 2016-2026 by 柏大衛. All rights reserved. */

import { expect } from 'vitest';

import { EntityId } from '../../token/entityId';
import { Offset } from '../offset';

describe('Offset', () => {
   it('accepts used an entity id', () => {
      const offset = new Offset(new EntityId());

      expect(offset.index).toEqual(0);
      expect(offset.row).toEqual(0);
      expect(offset.column).toEqual(0);
   });

   it('accepts entity id plus index, row and column', () => {
      const offset = new Offset(new EntityId('s', 'p'), 1, 2, 3);
      const entityId: EntityId = offset.entityId;

      expect(entityId.systemId).toEqual('s');
      expect(entityId.publicId).toEqual('p');
      expect(offset.index).toEqual(1);
      expect(offset.row).toEqual(2);
      expect(offset.column).toEqual(3);
   });

   it('accepts an offset which it clones', () => {
      const offset = new Offset(new EntityId('s', 'p'), 1, 2, 3);

      const clone = new Offset(offset);

      expect(offset).toEqual(clone);
      expect(offset.entityId).not.toBe(clone.entityId);
   });
});
