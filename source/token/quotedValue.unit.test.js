/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import util from '../chunk/index.test.js';

import quotedValue from './quotedValue.js';

describe('quotedValue', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic parse', () => {
         mockSource = new util.MockChunkSource([
            util.makeChunk('"'),
            util.makeChunk('blah'),
            util.makeChunk('"'),
         ]);

         quotedValue.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            openQuoteChunk: util.makeChunk('"'),
            valueChunk: util.makeChunk('blah'),
            closeQuoteChunk: util.makeChunk('"'),
         } ] ]);
      });

   });

});
