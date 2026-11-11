/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { ParameterEntityReferencePToken } from 'pToken';
import { ParameterEntityStartPToken } from 'token';
import { vi } from 'vitest';

import { parameterEntityReferenceCheck } from '../../token/parameterEntityReferenceCheck';
import { parameterEntityStartCheck } from '../parameterEntityStartCheck';

vi.mock('../../token/parameterEntityReferenceCheck');

describe('parameterEntityReferenceCheck (unit)', () => {
   it('calls generalEntityReferenceCheck on reference', () => {
      const confVer = new ConformanceVersion();
      const collector = new ParamCollector();
      const reference = new ParameterEntityReferencePToken({
         name: toSToken('foo'),
         open: toSToken('%'),
      });
      const token = new ParameterEntityStartPToken(reference);

      parameterEntityStartCheck(token, collector, confVer);

      expect(parameterEntityReferenceCheck).toHaveBeenCalledWith(reference, collector, confVer);
   });
});
