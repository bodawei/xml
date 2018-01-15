/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { WellFormedError } from '../../error';
import { MockErrorCollector } from '../../error/@test/helper';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/@test/helper';

import * as instruction from '../bridge/instruction.js';
import * as processingInstruction from '../processingInstruction.js';

describe('processingInstruction (unit)', () => {
   let piPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      piPToken = new processingInstruction.PToken({
         type: 'PROCESSING_INSTRUCTION',
         instruction: makeSToken('blah'),
         close: makeSToken('?>'),
      });
   });

   describe('PToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            expect(piPToken.getSTokenArray()).toEqual([
               piPToken.instruction,
               piPToken.close,
            ]);
         });

      });

   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic parse', () => {
         const mockSource = new MockSTokenSource([
            [ 'blah', 'all', [ '?>' ] ],
            [ '?>', 'match', '?>' ],
         ]);

         processingInstruction.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(piPToken);
      });

      it('returns a value with no values if we are at end of input', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
         ]);
         piPToken.instruction = undefined;
         piPToken.close = undefined;

         processingInstruction.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(piPToken);
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
         processingInstruction.checkWellFormed(piPToken, mockErrorCollector, emd);

         expect(instruction.checkWellFormed).toHaveBeenCalledWith(piPToken, mockErrorCollector, emd);
      });

      it('reports an error if there is no close', () => {
         delete piPToken.close;

         processingInstruction.checkWellFormed(piPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PI_NO_CLOSE,
            params: [ '' ],
            lastPosition: piPToken.instruction,
         });
      });

   });

   describe('pTokenToXToken()', () => {

      it('creates a processing instruction token', () => {
         const token = processingInstruction.pTokenToXToken(piPToken);

         expect(token).toEqual(new processingInstruction.XToken('', 'blah', piPToken));
      });

   });

});
