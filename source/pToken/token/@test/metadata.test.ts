/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { METADATA_PTOKEN, MetadataPToken } from '../metadata';

describe('MetadataPToken', () => {
   it('exports a METADATA_PTOKEN constant', () => {
      expect(METADATA_PTOKEN).toEqual('METADATA_PTOKEN');
   });

   it('exports a MetadataPToken type', () => {
      const token: MetadataPToken = {
         type: METADATA_PTOKEN,
      };
      
      // This is a lame test.  The core of it really is that
      // we can use the type declaration above without is causing problems.
      expect(token).toEqual({
         type: 'METADATA_PTOKEN',
      });
   });
});

