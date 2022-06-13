/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { MockSTokenSource } from 'pToken-test';

import {
   parseProcessingInstruction,
   ProcessingInstructionPToken,
   PROCESSING_INSTRUCTION_PTOKEN,
} from '../processingInstruction';

describe('ProcessingInstructionPToken (unit)', () => {
   describe('ProcessingInstructionPToken()', () => {
      it('can be constructed with just an open token', () => {
         const result = new ProcessingInstructionPToken({ open: toSToken('<?') });

         expect(result).toEqual({
            type: PROCESSING_INSTRUCTION_PTOKEN,
            open: toSToken('<?'),
            target: undefined,
            targetSpace: undefined,
            instruction: undefined,
            close: undefined,
         });
      });

      it('can be constructed with a full raw PToken', () => {
         const result = new ProcessingInstructionPToken({
            open: toSToken('<?'),
            openSpace: toSToken(' '),
            target: toSToken('xml'),
            targetSpace: toSToken('\t'),
            instruction: toSToken('blahblah'),
            close: toSToken('?>'),
         });

         expect(result).toEqual({
            type: PROCESSING_INSTRUCTION_PTOKEN,
            open: toSToken('<?'),
            openSpace: toSToken(' '),
            target: toSToken('xml'),
            targetSpace: toSToken('\t'),
            instruction: toSToken('blahblah'),
            close: toSToken('?>'),
         });
      });

      it('can be constructed with a full ProcessingInstructionPToken and a set of overriding values', () => {
         const first = new ProcessingInstructionPToken({
            open: toSToken('<?'),
            openSpace: toSToken(' '),
            target: toSToken('xml'),
            targetSpace: toSToken('\t'),
            instruction: toSToken('blahblah'),
            close: toSToken('?>'),
         });

         const result = new ProcessingInstructionPToken(first, {
            open: toSToken('<?'),
            openSpace: toSToken('\n'),
            target: toSToken('frog'),
            targetSpace: toSToken(' '),
            instruction: toSToken('no way'),
            close: toSToken('?>'),
         });

         expect(result).toEqual({
            type: PROCESSING_INSTRUCTION_PTOKEN,
            open: toSToken('<?'),
            openSpace: toSToken('\n'),
            target: toSToken('frog'),
            targetSpace: toSToken(' '),
            instruction: toSToken('no way'),
            close: toSToken('?>'),
         });
      });
   });

   describe('parseProcessingInstruction()', () => {
      let result: ProcessingInstructionPToken;

      function getResult(x: ProcessingInstructionPToken): void {
         result = x;
      }

      it('does a basic parse', () => {
         const mockSource = new MockSTokenSource([
            ['blah', 'all', ['?>']],
            ['?>', 'match', '?>'],
         ]);

         parseProcessingInstruction(mockSource, { open: toSToken('<?') }, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless(
            new ProcessingInstructionPToken({
               open: toSToken('<?'),
               instruction: toSToken('blah'),
               close: toSToken('?>'),
            }),
         );
      });

      it('returns a value with no values if we are at end of input', () => {
         const mockSource = new MockSTokenSource([undefined, undefined]);

         parseProcessingInstruction(mockSource, { open: toSToken('<?') }, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(result).toEqualRangeless({
            open: toSToken('<?'),
            instruction: undefined,
            close: undefined,
         });
      });
   });
});
