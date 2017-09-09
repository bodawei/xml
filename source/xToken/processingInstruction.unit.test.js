/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { WellFormedError } from '../error';
import { MockErrorCollector } from '../error/test';
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

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let parsed;
      let expectedLToken;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         expectedLToken = makeLTokenMaker();
         parsed = {
            type: 'PROCESSING_INSTRUCTION',
            open: expectedLToken('<?'),
            postOpenSpace: undefined,
            target: expectedLToken('foo'),
            postTargetSpace: expectedLToken(' '),
         };
      });

      it('reports an error if there is a space after the "<?"', () => {
         parsed.postOpenSpace = expectedLToken(' ');

         processingInstruction.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PI_SPACE_BEFORE_TARGET,
            params: [ 'foo' ],
            position: parsed.postOpenSpace,
         });
      });

   });

});
