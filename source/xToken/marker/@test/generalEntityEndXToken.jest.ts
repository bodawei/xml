/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { GeneralEntityEndXToken } from '../generalEntityEndXToken';

describe('GeneralEntityEndXToken (unit)', () => {
   it('is constructed with the specified name', () => {
      const token = new GeneralEntityEndXToken('foo');

      expect(token.name).toEqual('foo');
      expect(token.pToken).toBeUndefined();
   });
});
