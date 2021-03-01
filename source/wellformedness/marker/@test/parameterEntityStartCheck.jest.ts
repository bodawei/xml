/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { ParameterEntityReferencePToken } from 'pToken';
import { SToken } from 'sToken';
import { ParameterEntityStartPToken } from 'token';

import { parameterEntityReferenceCheck } from '../../token/parameterEntityReferenceCheck';
import { parameterEntityStartCheck } from '../parameterEntityStartCheck';

jest.mock('../../token/parameterEntityReferenceCheck');

describe('parameterEntityReferenceCheck (unit)', () => {
   it('calls generalEntityReferenceCheck on reference', () => {
      const confVer = new ConformanceVersion();
      const ec = new MockErrorCollector();
      const reference = new ParameterEntityReferencePToken({
         open: SToken.fromString('%'),
         name: SToken.fromString('foo'),
      });
      const token = new ParameterEntityStartPToken(reference);

      parameterEntityStartCheck(token, ec, confVer);

      expect(parameterEntityReferenceCheck).toHaveBeenCalledWith(reference, ec, confVer);
   });
});
