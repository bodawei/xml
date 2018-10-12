/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { ParameterEntityEndXToken } from '../parameterEntityEnd';

describe('ParameterEntityEndXToken (unit)', () => {

   it('is constructed with the specified name', () => {
      const token = new ParameterEntityEndXToken('foo');

      expect(token.name).toEqual('foo');
      expect(token.pToken).toBeUndefined();
   });

});
