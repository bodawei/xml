/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { describe, expect, it } from 'vitest';

import { geRefValidate } from '../../common/geRefValidate';
import { generalEntityReferenceValidate } from '../generalEntityReferenceValidate';

describe('generalEntityReferenceValidate (unit)', () => {
   it('is identical to thecommon routine geRefValidate', () => {
      expect(generalEntityReferenceValidate).toBe(geRefValidate);
   });
});
