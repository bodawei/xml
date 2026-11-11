/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { GeneralEntityReferencePToken } from 'pToken';
import { GeneralEntityStartPToken } from 'token';
import { vi } from 'vitest';

import { generalEntityReferenceCheck } from '../../token/generalEntityReferenceCheck';
import { generalEntityStartCheck } from '../generalEntityStartCheck';

vi.mock('../../token/generalEntityReferenceCheck');

describe('generalEntityStartCheck (unit)', () => {
   it('calls generalEntityReferenceCheck on reference', () => {
      const confVer = new ConformanceVersion();
      const collector = new ParamCollector();
      const reference = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('foo'),
      });
      const token = new GeneralEntityStartPToken(reference);

      generalEntityStartCheck(token, collector, confVer);

      expect(generalEntityReferenceCheck).toHaveBeenCalledWith(reference, collector, confVer);
   });
});
