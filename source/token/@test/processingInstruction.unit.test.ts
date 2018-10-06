/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { WellFormedError } from '../../error';
import { MockErrorCollector } from '../../error/@test/helper';
import { SToken } from '../../sToken';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/@test/helper';

import * as instruction from '../bridge/instruction.js';
import {
   parseProcessingInstruction,
   ProcessingInstructionPToken,
   ProcessingInstructionXToken,
   PTYPE,
} from '../processingInstruction.js';

describe('processingInstruction (unit)', () => {
   let piPToken: any;

   beforeEach(() => {
      const protoPToken = {
         open: SToken.fromString(''),
         instruction: SToken.fromString('blah'),
         close: SToken.fromString('?>'),
      };
      piPToken = new ProcessingInstructionPToken(protoPToken);
   });

   // describe('PToken', () => {

   //    describe('getSTokenStream()', () => {

   //       it('returns all the STokens', () => {
   //          expect(piPToken.getSTokenArray()).toEqual([
   //             piPToken.instruction,
   //             piPToken.close,
   //          ]);
   //       });

   //    });

   // });

   describe('parse()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic parse', () => {
         const mockSource = new MockSTokenSource([
            [ 'blah', 'all', [ '?>' ] ],
            [ '?>', 'match', '?>' ],
         ]);

         parseProcessingInstruction(mockSource, { open: SToken.fromString('') }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(piPToken);
      });

      it('returns a value with no values if we are at end of input', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
         ]);

         parseProcessingInstruction(mockSource, { open: SToken.fromString('') }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({ open: SToken.fromString('') });
      });

   });

   // describe('checkWellFormed()', () => {
   //    let mockErrorCollector;
   //    let emd;

   //    beforeEach(() => {
   //       mockErrorCollector = new MockErrorCollector();
   //       emd = new EntityMetaData();
   //       spyOn(instruction, 'checkWellFormed');
   //    });

   //    it('calls instruction.checkWellFormed with the expected arguments', () => {
   //       processingInstruction.checkWellFormed(piPToken, mockErrorCollector, emd);

   //       expect(instruction.checkWellFormed).toHaveBeenCalledWith(piPToken, mockErrorCollector, emd);
   //    });

   //    it('reports an error if there is no close', () => {
   //       delete piPToken.close;

   //       processingInstruction.checkWellFormed(piPToken, mockErrorCollector, new EntityMetaData());

   //       expect(mockErrorCollector).toReportError({
   //          id: WellFormedError.ID.PI_NO_CLOSE,
   //          params: [ '' ],
   //          lastPosition: piPToken.instruction,
   //       });
   //    });

   // });

   describe('pToken.toXToken()', () => {

      it('creates a processing instruction token', () => {
         const xToken = piPToken.toXToken();

         expect(xToken).toEqual(new ProcessingInstructionXToken('', 'blah', piPToken));
      });

   });

});
