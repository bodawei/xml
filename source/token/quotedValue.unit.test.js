/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import * as lTokenUtil from '../lToken/test';

import quotedValue from './quotedValue.js';

describe('quotedValue', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic parse', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('"'),
            lTokenUtil.makeLToken('blah'),
            lTokenUtil.makeLToken('"'),
         ]);

         quotedValue.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            openQuoteLToken: lTokenUtil.makeLToken('"'),
            valueLToken: lTokenUtil.makeLToken('blah'),
            closeQuoteLToken: lTokenUtil.makeLToken('"'),
         } ] ]);
      });

   });

});
