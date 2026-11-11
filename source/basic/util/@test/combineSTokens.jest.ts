/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import { describe, it, expect } from 'vitest';

import { SToken } from '../../sToken/sToken';
import { EntityId } from '../../token/entityId';
import { combineSTokens } from '../combineSTokens';
import { Range } from '../range';

describe('combineSTokens()', () => {
   it('returns the first if the second is undefined', () => {
      const sToken1 = new SToken(' \n', ' \r\n', []);

      const result = combineSTokens(sToken1, undefined);

      expect(result).toBe(sToken1);
   });

   it('returns the second if the first is undefined', () => {
      const sToken1 = new SToken(' \n', ' \r\n', []);

      const result = combineSTokens(undefined, sToken1);

      expect(result).toBe(sToken1);
   });

   it('merges a second Stoken with the first', () => {
      const sToken1 = new SToken(' \n', ' \r\n', []);
      const sToken2 = new SToken('two', 'two', []);

      const result = combineSTokens(sToken1, sToken2);

      expect(result).toEqual(new SToken(' \ntwo', ' \r\ntwo', []));
   });

   it('does not alter either the source or target tokens', () => {
      const sToken1 = new SToken(' \n', ' \r\n', [new Range(new EntityId(), 1, 2, 3)]);
      const sToken2 = new SToken('two', 'two', [new Range(new EntityId(), 1, 2, 3)]);

      combineSTokens(sToken1, sToken2);

      expect(sToken1).toEqual(new SToken(' \n', ' \r\n', [new Range(new EntityId(), 1, 2, 3)]));
      expect(sToken2).toEqual(new SToken('two', 'two', [new Range(new EntityId(), 1, 2, 3)]));
   });

   it('combines range if first has no range', () => {
      const sToken1 = new SToken(' \n', ' \r\n', []);
      const sToken2 = new SToken('two', 'two', new Range(new EntityId(), 1, 2, 3));

      const result = combineSTokens(sToken1, sToken2);

      expect(result).toEqual(
         new SToken(' \ntwo', ' \r\ntwo', [new Range(new EntityId(), 1, 2, 3)]),
      );
   });

   it('combines range if second has no range', () => {
      const sToken1 = new SToken(' \n', ' \r\n', new Range(new EntityId(), 1, 2, 3));
      const sToken2 = new SToken('two', 'two', []);

      const result = combineSTokens(sToken1, sToken2);

      expect(result).toEqual(
         new SToken(' \ntwo', ' \r\ntwo', [new Range(new EntityId(), 1, 2, 3)]),
      );
   });

   it('simply concatnates the ranges if the two have no overlap', () => {
      const sToken1 = new SToken(' \n', ' \r\n', new Range(new EntityId('here'), 1, 2, 3));
      const sToken2 = new SToken('two', 'two', new Range(new EntityId('there'), 1, 2, 3));

      const result = combineSTokens(sToken1, sToken2);

      expect(result?.ranges).toEqual([
         new Range(new EntityId('here'), 1, 2, 3),
         new Range(new EntityId('there'), 1, 2, 3),
      ]);
   });

   it('fuses ranges if they seem to touch', () => {
      const sToken1 = new SToken(' \n', ' \r\n', [
         new Range(new EntityId('here'), 1, 2, 3),
         new Range(new EntityId('foo'), 1, 0, 1, 2, 0, 2),
      ]);
      const sToken2 = new SToken('two', 'two', [
         new Range(new EntityId('foo'), 2, 0, 2, 5, 2, 1),
         new Range(new EntityId('there'), 1, 2, 3),
      ]);

      const result = combineSTokens(sToken1, sToken2);

      expect(result?.ranges).toEqual([
         new Range(new EntityId('here'), 1, 2, 3),
         new Range(new EntityId('foo'), 1, 0, 1, 5, 2, 1),
         new Range(new EntityId('there'), 1, 2, 3),
      ]);
   });
});
