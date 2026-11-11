/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParameterEntityReferencePToken } from 'pToken';

import { ParameterEntityStartPToken } from '../parameterEntityStart';

describe('ParameterEntityStartPToken (unit)', () => {
   let confVer: ConformanceVersion;

   beforeEach(() => {
      confVer = new ConformanceVersion();
   });

   it('is constructed with the specified name', () => {
      const token = new ParameterEntityStartPToken(
         new ParameterEntityReferencePToken({ open: toSToken('%') }),
      );

      expect(token.referencePToken).toEqual(
         new ParameterEntityReferencePToken({ open: toSToken('%') }),
      );
   });
});
