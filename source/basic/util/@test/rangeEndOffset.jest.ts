/* Copyright ® 2022-2026 by 柏大衛. All rights reserved. */

import { expect } from 'vitest';

import { EntityId } from '../../token/entityId';
import { Offset } from '../offset';
import { Range } from '../range';
import { rangeEndOffset } from '../rangeEndOffset';

describe('rangeEndOffset()', () => {
   it('returns an Offset that is the start of the Range', () => {
      const range = new Range(new EntityId('s', 'p'), 1, 2, 3, 4, 5, 6);

      expect(rangeEndOffset(range)).toEqual(new Offset(new EntityId('s', 'p'), 4, 5, 6));
   });
});
