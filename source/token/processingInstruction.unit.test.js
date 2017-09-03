/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as processingInstruction from './processingInstruction.js';

describe('processingInstruction', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic PI parse', () => {
         const sourceLToken = makeLTokenMaker();
         const startLToken = sourceLToken('<?');
         mockSource = new MockLTokenSource([
            sourceLToken(' '),
            sourceLToken('foo'),
            sourceLToken(' '),
            sourceLToken('blah'),
            sourceLToken('?>'),
         ]);

         processingInstruction.parse(mockSource, startLToken, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker();
         expect(callback).toContainParsedProps({
            type: 'PROCESSING_INSTRUCTION',
            open: expectedLToken('<?'),
            postOpenSpace: expectedLToken(' '),
            target: expectedLToken('foo'),
            postTargetSpace: expectedLToken(' '),
            instruction: expectedLToken('blah'),
            close: expectedLToken('?>'),
         });
      });

   });

});
