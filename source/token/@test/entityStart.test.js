/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import entityStart from '../entityStart.js';

describe('entityStart (unit)', () => {

   describe('Token', () => {

      it('is constructed with the specified name', () => {
         const token = new entityStart.XToken('foo');

         expect(token.name).toEqual('foo');
         expect(token.pToken).toEqual([]);
      });

   });

   describe('ParamXToken', () => {

      it('is constructed with the specified name', () => {
         const token = new entityStart.ParamXToken('foo');

         expect(token.name).toEqual('foo');
         expect(token.pToken).toEqual([]);
      });

   });

});
