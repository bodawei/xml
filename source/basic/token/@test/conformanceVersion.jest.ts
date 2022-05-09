/* Copyright ® 2020-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { CONFORMANCE_VERSION, ConformanceVersion } from '../conformanceVersion';

describe('ConformanceVersion', () => {
   it('exports a CONFORMANCE_VERSION constant', () => {
      expect(CONFORMANCE_VERSION).toEqual('CONFORMANCE_VERSION');
   });

   it('exports a ConformanceVersion type', () => {
      const token: ConformanceVersion = {
         type: CONFORMANCE_VERSION,
         version: 1,
         edition: 4,
      };

      // This is a lame test.  The core of it really is that
      // we can use the type declaration above without is causing problems.
      expect(token).toEqual({
         type: 'CONFORMANCE_VERSION',
         version: 1,
         edition: 4,
      });
   });

   it('constructs from another instance', () => {
      const token: ConformanceVersion = new ConformanceVersion(1, 4);

      expect(new ConformanceVersion(token)).toEqual({
         type: 'CONFORMANCE_VERSION',
         version: 1,
         edition: 4,
      });
   });

   it('constructs with no arguments', () => {
      expect(new ConformanceVersion()).toEqual({
         type: 'CONFORMANCE_VERSION',
         version: 1,
         edition: 5,
      });
   });

   it('constructs with only a 1.1 version ', () => {
      expect(new ConformanceVersion(1.1)).toEqual({
         type: 'CONFORMANCE_VERSION',
         version: 1.1,
         edition: 2,
      });
   });

   it('constructs with only a 1.0 version ', () => {
      expect(new ConformanceVersion(1.0)).toEqual({
         type: 'CONFORMANCE_VERSION',
         version: 1,
         edition: 5,
      });
   });
});
