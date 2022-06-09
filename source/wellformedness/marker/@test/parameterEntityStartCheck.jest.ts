/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { ParamCollector } from 'basic-test';
import { ParameterEntityReferencePToken } from 'pToken';
import { toSToken } from 'sToken';
import { ParameterEntityStartPToken } from 'token';

import { parameterEntityReferenceCheck } from '../../token/parameterEntityReferenceCheck';
import { parameterEntityStartCheck } from '../parameterEntityStartCheck';

jest.mock('../../token/parameterEntityReferenceCheck');

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
