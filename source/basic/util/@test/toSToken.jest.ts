/* Copyright ® 2022 by 柏大衛. All rights reserved. */

import { describe, it, expect } from '@jest/globals';

import { toSToken } from '../toSToken';

describe('isSToken()', () => {
   it('returns true when parameter is an sToken', () => {
      const sToken = toSToken('argh');

      expect(sToken).toEqual({
         originalStr: 'argh',
         ranges: [
            {
               endColumn: 0,
               endIndex: 0,
               endRow: 0,
               entityId: {
                  publicId: undefined,
                  systemId: '',
                  type: 'ENTITY_ID',
               },
               startColumn: 0,
               startIndex: 0,
               startRow: 0,
            },
         ],
         str: 'argh',
      });
   });
});
