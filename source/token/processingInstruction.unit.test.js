/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import chunkUtil from '../chunk/test';

import processingInstruction from './processingInstruction.js';

describe('processingInstruction', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic PI parse', () => {
         const startChunk = chunkUtil.makeChunk('<?');
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('foo'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('blah'),
            chunkUtil.makeChunk('?>'),
         ]);

         processingInstruction.parse(mockSource, startChunk, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'PROCESSING_INSTRUCTION',
            openChunk: chunkUtil.makeChunk('<?'),
            postOpenSpaceChunk: chunkUtil.makeChunk(' '),
            targetChunk: chunkUtil.makeChunk('foo'),
            postTargetSpaceChunk: chunkUtil.makeChunk(' '),
            instructionChunk: chunkUtil.makeChunk('blah'),
            closeChunk: chunkUtil.makeChunk('?>'),
         });
      });

   });

});
