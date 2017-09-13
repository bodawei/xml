/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { WellFormedError } from '../error';
import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as instruction from './instruction.js';
import * as processingInstruction from './processingInstruction.js';

describe('processingInstruction', () => {
   let defaultParsed;

   beforeEach(() => {
      const expectedLToken = makeLTokenMaker();
      defaultParsed = {
         type: 'PROCESSING_INSTRUCTION',
         instruction: expectedLToken('blah'),
         close: expectedLToken('?>'),
      };
   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         spyOn(instruction, 'retype').and.returnValue({ type: processingInstruction.TYPE });
      });

      it('calls instruction.parse()', () => {
         const mockSource = new MockLTokenSource([
            'blah',
            '?>',
         ]);

         processingInstruction.parse(mockSource, {}, callback);

         expect(instruction.retype).toHaveBeenCalledWith(processingInstruction.TYPE, {});
      });

      it('does a basic parse', () => {
         const mockSource = new MockLTokenSource([
            [ 'blah', 'all', [ '?>' ] ],
            [ '?>', 'match', '?>' ],
         ]);

         processingInstruction.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(defaultParsed);
      });

      it('returns a value with no values if we are at end of input', () => {
         const mockSource = new MockLTokenSource([
            undefined,
            undefined,
         ]);
         defaultParsed.instruction = undefined;
         defaultParsed.close = undefined;

         processingInstruction.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(defaultParsed);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let emd;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();
         spyOn(instruction, 'checkWellFormed');
      });

      it('calls instruction.checkWellFormed with the expected arguments', () => {
         processingInstruction.checkWellFormed(defaultParsed, mockErrorCollector, emd);

         expect(instruction.checkWellFormed).toHaveBeenCalledWith(defaultParsed, mockErrorCollector, emd);
      });

      it('reports an error if there is no close', () => {
         delete defaultParsed.close;

         processingInstruction.checkWellFormed(defaultParsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PI_NO_CLOSE,
            params: [ '' ],
            lastPosition: defaultParsed.instruction,
         });
      });

   });

   describe('makeToken()', () => {
      beforeEach(() => {
         spyOn(instruction, 'appendLTokens');
      });

      it('calls instruction.appendLTokens with the expected arguments', () => {
         const token = processingInstruction.makeToken(defaultParsed);

         expect(instruction.appendLTokens).toHaveBeenCalledWith(token.lTokens, defaultParsed);
      });

      it('creates a token with a blank target, instruction and tokens', () => {
         const token = processingInstruction.makeToken(defaultParsed);

         expect(token).toEqual(new processingInstruction.Token('', 'blah', [
            defaultParsed.instruction,
            defaultParsed.close,
         ]));
      });

   });

});
