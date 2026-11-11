/* Copyright ® 2016-2026 by 柏大衛. All rights reserved. */

import { expect } from 'vitest';

import { EntityId } from '../../token/entityId';
import { Offset } from '../offset';
import { Range } from '../range';

describe('Range', () => {
   it('constructs an instance from an entity id and all position numbers', () => {
      const range = new Range(new EntityId('s', 'p'), 1, 2, 3, 4, 5, 6);

      expect(range.entityId.systemId).toEqual('s');
      expect(range.entityId.publicId).toEqual('p');
      expect(range.startIndex).toEqual(1);
      expect(range.startRow).toEqual(2);
      expect(range.startColumn).toEqual(3);
      expect(range.endIndex).toEqual(4);
      expect(range.endRow).toEqual(5);
      expect(range.endColumn).toEqual(6);
   });

   it('constructs an instance from just an Offset', () => {
      const range = new Range(new Offset(new EntityId('s', 'p'), 6, 5, 4));

      expect(range.entityId.systemId).toEqual('s');
      expect(range.entityId.publicId).toEqual('p');
      expect(range.startIndex).toEqual(6);
      expect(range.startRow).toEqual(5);
      expect(range.startColumn).toEqual(4);
      expect(range.endIndex).toEqual(6);
      expect(range.endRow).toEqual(5);
      expect(range.endColumn).toEqual(4);
   });

   it('constructs an new instance from an offset', () => {
      const range = new Range(new Offset(new EntityId('s', 'p'), 6, 5, 4));
      const newRange = new Range(range);

      expect(range).toEqual(newRange);
      expect(range.entityId).not.toBe(newRange.entityId);
   });
});
