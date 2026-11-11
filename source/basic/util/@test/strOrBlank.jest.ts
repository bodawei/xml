/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { describe, it, expect } from 'vitest';

import { strOrBlank } from '../strOrBlank';
import { toSToken } from '../toSToken';

describe('strOrBlank (unit)', () => {
   it('returns blank if the SToken is undefined', () => {
      const result = strOrBlank(undefined);

      expect(result).toEqual('');
   });

   it('returns the value of the SToken.str', () => {
      const token = toSToken('hi');
      const result = strOrBlank(token);

      expect(result).toEqual('hi');
   });
});
