/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as quotedValue from './quotedValue.js';

describe('quotedValue', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic parse', () => {
         mockSource = new MockLTokenSource([
            '"',
            'blah',
            '"',
         ]);

         quotedValue.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker();
         expect(callback.calls.allArgs()).toEqual([ [ {
            openQuote: expectedLToken('"'),
            value: expectedLToken('blah'),
            closeQuote: expectedLToken('"'),
         } ] ]);
      });

   });

});
