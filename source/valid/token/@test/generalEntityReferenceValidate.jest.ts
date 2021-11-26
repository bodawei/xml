/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { geRefValidate } from '../../common/geRefValidate';
import { generalEntityReferenceValidate } from '../generalEntityReferenceValidate';

describe('generalEntityReferenceValidate (unit)', () => {
   it('is identical to thecommon routine geRefValidate', () => {
      expect(generalEntityReferenceValidate).toBe(geRefValidate);
   });
});
