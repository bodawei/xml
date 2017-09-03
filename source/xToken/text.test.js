/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { makeLTokenMaker } from '../lToken/test';

import * as text from './text.js';

describe('text (unit)', () => {
   let expectedLToken;

   beforeEach(() => {
      expectedLToken = makeLTokenMaker();
   });

   describe('Token', () => {

      it('is constructed with value and LTokens', () => {
         const lToken = expectedLToken('foo');

         const token = new text.Token('foo', [ lToken ]);

         expect(token.text).toEqual('foo');
         expect(token.lTokens).toEqual([
            lToken,
         ]);
      });

   });

});
