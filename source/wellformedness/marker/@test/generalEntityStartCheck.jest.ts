/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { GeneralEntityReferencePToken } from 'pToken';
import { SToken } from 'sToken';
import { GeneralEntityStartPToken } from 'token';

import { generalEntityReferenceCheck } from '../../token/generalEntityReferenceCheck';
import { generalEntityStartCheck } from '../generalEntityStartCheck';

jest.mock('../../token/generalEntityReferenceCheck');

describe('generalEntityStartCheck (unit)', () => {
   it('calls generalEntityReferenceCheck on reference', () => {
      const confVer = new ConformanceVersion();
      const ec = new MockErrorCollector();
      const reference = new GeneralEntityReferencePToken({
         open: SToken.fromString('&'),
         name: SToken.fromString('foo'),
      });
      const token = new GeneralEntityStartPToken(reference);

      generalEntityStartCheck(token, ec, confVer);

      expect(generalEntityReferenceCheck).toHaveBeenCalledWith(reference, ec, confVer);
   });
});
