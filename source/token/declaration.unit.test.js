/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import util from '../chunk/index.test.js';

import declaration from './declaration.js';

describe('declaration', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does not do any other parsing if no declaration type is found', () => {
         const openChunk = util.makeChunk('<!');
         mockSource = new util.MockChunkSource([
            util.makeChunk(' '),
            undefined,
            undefined,
         ]);

         declaration.parse(mockSource, openChunk, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'GENERIC_DECLARATION',
            openChunk: util.makeChunk('<!'),
            postOpenSpaceChunk: util.makeChunk(' '),
            declTypeChunk: undefined,
            postDeclTypeSpaceChunk: undefined,
         } ] ]);
      });

   });

});
