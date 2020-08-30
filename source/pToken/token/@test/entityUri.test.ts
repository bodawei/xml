/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ENTITY_URI, EntityUri } from '../entityUri';
import { EntityLocation } from 'basic';

describe('ConformanceVersion', () => {
   it('exports a ENTITY_URI constant', () => {
      expect(ENTITY_URI).toEqual('ENTITY_URI');
   });

   it('exports a ConformanceVersion type', () => {
      const token: EntityUri = {
         type: ENTITY_URI,
         location: new EntityLocation(),
      };

      // This is a lame test.  The core of it really is that
      // we can use the type declaration above without is causing problems.
      expect(token).toEqual({
         type: 'ENTITY_URI',
         location: new EntityLocation(),
      });
   });
});
