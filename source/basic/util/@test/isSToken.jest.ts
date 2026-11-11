/* Copyright ® 2016-2026 by 柏大衛. All rights reserved. */

import { describe, it, expect } from 'vitest';

import { SToken } from '../../sToken/sToken';
import { EntityId } from '../../token/entityId';
import { Range } from '../../util/range';
import { isSToken } from '../isSToken';

describe('isSToken()', () => {
   it('returns true when parameter is an sToken', () => {
      const sToken = new SToken('foo', 'bar', [new Range(new EntityId(), 1, 2, 3, 4, 5, 6)]);

      expect(isSToken(sToken)).toEqual(true);
   });

   it('returns true when parameter is a duck-typed sToken', () => {
      expect(
         isSToken({
            originalStr: 'foo',
            str: 'bar',
            ranges: [],
         }),
      ).toEqual(true);
   });

   it('returns false when parameter is null', () => {
      expect(isSToken(null)).toEqual(false);
   });

   it('returns false when parameter is undefined', () => {
      expect(isSToken(undefined)).toEqual(false);
   });

   it('returns false when parameter is an object without the right properties', () => {
      expect(isSToken({ foo: true })).toEqual(false);
   });
});
