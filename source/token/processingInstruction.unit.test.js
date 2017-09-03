/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import lTokenUtil from '../lToken/test';

import processingInstruction from './processingInstruction.js';

describe('processingInstruction', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic PI parse', () => {
         const startLToken = lTokenUtil.makeLToken('<?');
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('foo'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('blah'),
            lTokenUtil.makeLToken('?>'),
         ]);

         processingInstruction.parse(mockSource, startLToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'PROCESSING_INSTRUCTION',
            openLToken: lTokenUtil.makeLToken('<?'),
            postOpenSpaceLToken: lTokenUtil.makeLToken(' '),
            targetLToken: lTokenUtil.makeLToken('foo'),
            postTargetSpaceLToken: lTokenUtil.makeLToken(' '),
            instructionLToken: lTokenUtil.makeLToken('blah'),
            closeLToken: lTokenUtil.makeLToken('?>'),
         });
      });

   });

});
