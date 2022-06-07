/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import { ParameterEntityReferencePToken } from 'pToken';
import { SToken } from 'sToken';

import { ParameterEntityStartPToken } from '../parameterEntityStart';

describe('ParameterEntityStartPToken (unit)', () => {
   let confVer: ConformanceVersion;

   beforeEach(() => {
      confVer = new ConformanceVersion();
   });

   it('is constructed with the specified name', () => {
      const token = new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%') }));

      expect(token.referencePToken).toEqual(new ParameterEntityReferencePToken({ open: SToken.fromString('%') }));
   });


});
