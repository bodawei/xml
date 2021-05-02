/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { SToken } from 'sToken';

import { EntityId } from '../../EntityId';
import { makeOffset } from '../makeOffset';
import Range from '../../Range';
import Offset from '../../Offset';

describe('makeOffset', () => {
   it('returns undefined when passed nothing', () => {
      expect(makeOffset()).toBeUndefined();
   });

   it('returns a copy of the offset provided', () => {
      const input = new Offset(new EntityId(), 0, 0, 0);

      const result = makeOffset(input);

      expect(result).toEqual(input);
      expect(result).not.toBe(input);
   });

   it('returns a the offset from the first range element in an sToken', () => {
      const input = new SToken('one', 'two', [
         new Range(new EntityId(), 1, 2, 3, 4, 5, 6),
         new Range(new EntityId(), 10, 11, 12, 13, 14, 15),
      ]);

      const result = makeOffset(input);

      expect(result).toEqual(new Offset(new EntityId(), 1, 2, 3));
   });
});
