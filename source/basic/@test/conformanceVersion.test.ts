/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { CONFORMANCE_VERSION, ConformanceVersion } from '../conformanceVersion';

describe('ConformanceVersion', () => {
   it('exports a CONFORMANCE_VERSION constant', () => {
      expect(CONFORMANCE_VERSION).toEqual('CONFORMANCE_VERSION');
   });

   it('exports a ConformanceVersion type', () => {
      const token: ConformanceVersion = {
         type: CONFORMANCE_VERSION,
         version: 1,
         revision: 4,
      };

      // This is a lame test.  The core of it really is that
      // we can use the type declaration above without is causing problems.
      expect(token).toEqual({
         type: 'CONFORMANCE_VERSION',
         version: 1,
         revision: 4,
      });
   });

   it('can construct from another instance', () => {
      const token: ConformanceVersion = {
         type: CONFORMANCE_VERSION,
         version: 1,
         revision: 4,
      };

      expect(new ConformanceVersion(token)).toEqual(jasmine.objectContaining({
         type: 'CONFORMANCE_VERSION',
         version: 1,
         revision: 4,
      }));
   });

   it('can construct with no arguments', () => {
      expect(new ConformanceVersion()).toEqual(jasmine.objectContaining({
         type: 'CONFORMANCE_VERSION',
         version: 1,
         revision: 5,
      }));
   });

   it('can construct with only a 1.1 version ', () => {
      expect(new ConformanceVersion(1.1)).toEqual(jasmine.objectContaining({
         type: 'CONFORMANCE_VERSION',
         version: 1.1,
         revision: 2,
      }));
   });

   it('can construct with only a 1.0 version ', () => {
      expect(new ConformanceVersion(1.0)).toEqual(jasmine.objectContaining({
         type: 'CONFORMANCE_VERSION',
         version: 1,
         revision: 5,
      }));
   });
});
