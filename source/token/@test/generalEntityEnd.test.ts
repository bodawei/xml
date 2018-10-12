/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { GeneralEntityEndXToken } from '../generalEntityEnd';

describe('GeneralEntityEndXToken (unit)', () => {

   it('is constructed with the specified name', () => {
      const token = new GeneralEntityEndXToken('foo');

      expect(token.name).toEqual('foo');
      expect(token.pToken).toBeUndefined();
   });

});
