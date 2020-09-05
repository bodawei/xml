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
});
