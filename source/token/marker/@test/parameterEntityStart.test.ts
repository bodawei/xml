/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'error-test';
import { SToken } from 'sToken';

import { ParameterEntityReferencePToken } from '../../parameterEntityReference';
import { ParameterEntityStartPToken, ParameterEntityStartXToken } from '../parameterEntityStart';

import * as checks from 'source/wellformedness/token/parameterEntityReferenceCheck';


describe('ParameterEntityStartPToken (unit)', () => {
   let confVer: ConformanceVersion;
   let mockErrorCollector: MockErrorCollector;
   let checkSpy: jasmine.Spy;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      mockErrorCollector = new MockErrorCollector();

      checkSpy = spyOn(checks, 'parameterEntityReferenceCheck');
   });

   it('is constructed with the specified name', () => {
      const token = new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%') }));

      expect(token.referencePToken).toEqual(new ParameterEntityReferencePToken({ open: SToken.fromString('%') }));
   });

   it('calls checkWellFormed() in the related parameterEntityReferencePToken', () => {
      const reference = new ParameterEntityReferencePToken({ open: SToken.fromString('%') });
      const token = new ParameterEntityStartPToken(reference);

      token.checkWellFormed(mockErrorCollector, confVer);

      expect(checkSpy).toHaveBeenCalledWith(reference, mockErrorCollector, confVer);
   });

   it('will create an xToken', () => {
      const token = new ParameterEntityStartPToken(new ParameterEntityReferencePToken({
         open: SToken.fromString('%'),
         name: SToken.fromString('foo'),
      }));

      expect(token.toXToken()).toEqual(new ParameterEntityStartXToken('foo', token));
   });

});

describe('ParameterEntityStartXToken (unit)', () => {

   it('is constructed with the specified name', () => {
      const token = new ParameterEntityStartXToken('foo');

      expect(token.name).toEqual('foo');
      expect(token.pToken).toBeUndefined();
   });

});
