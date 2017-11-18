/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import * as entityEnd from './entityEnd.js';

describe('entityEnd (unit)', () => {

   describe('Token', () => {

      it('is constructed with the specified name', () => {
         const token = new entityEnd.XToken('foo');

         expect(token.name).toEqual('foo');
         expect(token.pToken).toEqual([]);
      });

   });

   describe('ParamXToken', () => {

      it('is constructed with the specified name', () => {
         const token = new entityEnd.ParamXToken('foo');

         expect(token.name).toEqual('foo');
         expect(token.pToken).toEqual([]);
      });

   });

});
