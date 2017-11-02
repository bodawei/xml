/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import * as entityStart from './entityStart.js';

describe('entityStart (unit)', () => {

   describe('Token', () => {

      it('is constructed with the specified name', () => {
         const token = new entityStart.Token('foo');

         expect(token.name).toEqual('foo');
         expect(token.lTokens).toEqual([]);
      });

   });

   describe('ParamToken', () => {

      it('is constructed with the specified name', () => {
         const token = new entityStart.ParamToken('foo');

         expect(token.name).toEqual('foo');
         expect(token.lTokens).toEqual([]);
      });

   });

});
