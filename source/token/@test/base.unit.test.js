/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import * as base from '../base.js';

describe('base', () => {

   describe('XToken', () => {

      it('throws an error if called without tokens', () => {
         expect(() => {
            new base.XToken();
         }).toThrowError('Must provide a PToken to the XToken you are constructing.');
      });

   });

});
