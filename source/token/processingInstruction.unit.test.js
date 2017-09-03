/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import util from '../chunk/index.test.js';

import processingInstruction from './processingInstruction.js';

describe('processingInstruction', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic PI parse', () => {
         const startChunk = util.makeChunk('<?');
         mockSource = new util.MockChunkSource([
            util.makeChunk(' '),
            util.makeChunk('foo'),
            util.makeChunk(' '),
            util.makeChunk('blah'),
            util.makeChunk('?>'),
         ]);

         processingInstruction.parse(mockSource, startChunk, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'PROCESSING_INSTRUCTION',
            openChunk: util.makeChunk('<?'),
            postOpenSpaceChunk: util.makeChunk(' '),
            targetChunk: util.makeChunk('foo'),
            postTargetSpaceChunk: util.makeChunk(' '),
            instructionChunk: util.makeChunk('blah'),
            closeChunk: util.makeChunk('?>'),
         });
      });

   });

});
