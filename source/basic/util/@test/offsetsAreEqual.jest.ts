/* Copyright ® 2022 by 柏大衛. All rights reserved. */

import { expect } from '@jest/globals';

import { EntityId } from '../../token/entityId';
import { Offset } from '../offset';
import { offsetsAreEqual } from '../offsetsAreEqual';

describe('offsetsAreEqual()', () => {
   it('reports true when they are equal', () => {
      const offset1 = new Offset(new EntityId('s', 'p'), 1, 2, 3);
      const offset2 = new Offset(new EntityId('s', 'p'), 1, 2, 3);

      expect(offsetsAreEqual(offset1, offset2)).toEqual(true);
   });

   it('reports false when numbers do not match', () => {
      const offset1 = new Offset(new EntityId('s', 'p'), 1, 2, 3);
      const offset2 = new Offset(new EntityId('s', 'p'), 1, 999, 3);

      expect(offsetsAreEqual(offset1, offset2)).toEqual(false);
   });

   it('reports false when entityId does not match', () => {
      const offset1 = new Offset(new EntityId('s', 'p'), 1, 2, 3);
      const offset2 = new Offset(new EntityId('s', 'p2'), 1, 2, 3);

      expect(offsetsAreEqual(offset1, offset2)).toEqual(false);
   });
});
