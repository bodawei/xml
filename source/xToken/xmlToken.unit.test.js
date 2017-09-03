/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import * as xmlToken from './xmlToken.js';

describe('xmlToken', () => {

   describe('token', () => {

      it('throws an error if called without tokens', () => {
         expect(() => {
            new xmlToken.Token();
         }).toThrowError('Must provide LTokens to the token you are constructing.');
      });

   });

});
