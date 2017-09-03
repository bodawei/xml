/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import chunkUtil from '../chunk/test';

import declaration from './declaration.js';

describe('declaration', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does not do any other parsing if no declaration type is found', () => {
         const openChunk = chunkUtil.makeChunk('<!');
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk(' '),
            undefined,
            undefined,
         ]);

         declaration.parse(mockSource, openChunk, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'GENERIC_DECLARATION',
            openChunk: chunkUtil.makeChunk('<!'),
            postOpenSpaceChunk: chunkUtil.makeChunk(' '),
            declTypeChunk: undefined,
            postDeclTypeSpaceChunk: undefined,
         } ] ]);
      });

   });

});
