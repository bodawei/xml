/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as entityEnd from './entityEnd.js';

describe('entityEnd (unit)', () => {

   describe('Token', () => {

      it('is constructed with the specified name', () => {
         const token = new entityEnd.Token('foo');

         expect(token.name).toEqual('foo');
         expect(token.lTokens).toEqual([]);
      });

   });

   describe('ParamToken', () => {

      it('is constructed with the specified name', () => {
         const token = new entityEnd.ParamToken('foo');

         expect(token.name).toEqual('foo');
         expect(token.lTokens).toEqual([]);
      });

   });

});
