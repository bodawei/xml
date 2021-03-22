/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { surrogatePairToCharCode } from '../surrogatePairToCharCode';

describe('surrogatePairToCharCode()', () => {
   it('converts a surrogate pair to a char code', () => {
      const result = surrogatePairToCharCode(0xd801, 0xdc37);

      expect(result).toEqual(0x10437);
   });
});
