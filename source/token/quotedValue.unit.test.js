/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import * as chunkUtil from '../chunk/test';

import quotedValue from './quotedValue.js';

describe('quotedValue', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic parse', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('"'),
            chunkUtil.makeChunk('blah'),
            chunkUtil.makeChunk('"'),
         ]);

         quotedValue.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            openQuoteChunk: chunkUtil.makeChunk('"'),
            valueChunk: chunkUtil.makeChunk('blah'),
            closeQuoteChunk: chunkUtil.makeChunk('"'),
         } ] ]);
      });

   });

});
