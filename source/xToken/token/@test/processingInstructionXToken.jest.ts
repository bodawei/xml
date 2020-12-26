/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ProcessingInstructionPToken } from 'pToken';
import { toSToken } from 'sToken';

import {
   ProcessingInstructionXToken,
   PROCESSING_INSTRUCTION_XTOKEN,
} from '../processingInstructionXToken';

describe('ProcessingInstructionXToken() (unit)', () => {
   it('accepts a PToken as input', () => {
      const piPToken = new ProcessingInstructionPToken({
         open: toSToken('open'),
         openSpace: toSToken(' '),
         target: toSToken('TheTarget'),
         instruction: toSToken('blah'),
         close: toSToken('?>'),
      });

      expect(new ProcessingInstructionXToken(piPToken)).toEqual(
         expect.objectContaining({
            type: PROCESSING_INSTRUCTION_XTOKEN,
            target: 'TheTarget',
            instruction: 'blah',
            pToken: piPToken,
         }),
      );
   });

   it('defaults target and instruction to empty strings if those are not in the PToken', () => {
      const piPToken = new ProcessingInstructionPToken({
         open: toSToken('open'),
         openSpace: toSToken(' '),
         close: toSToken('?>'),
      });

      expect(new ProcessingInstructionXToken(piPToken)).toEqual(
         expect.objectContaining({
            type: PROCESSING_INSTRUCTION_XTOKEN,
            target: '',
            instruction: '',
            pToken: piPToken,
         }),
      );
   });

   it('produces an xToken with the provided raw values', () => {
      const piXToken = new ProcessingInstructionXToken('TheTarget2', 'blah2');

      expect(piXToken).toEqual(
         expect.objectContaining({
            target: 'TheTarget2',
            instruction: 'blah2',
         }),
      );
   });

   it('produces an xToken with a blank instruction if none provided as a direct parameter', () => {
      const piXToken = new ProcessingInstructionXToken('TheTarget2');

      expect(piXToken).toEqual(
         expect.objectContaining({
            target: 'TheTarget2',
            instruction: '',
         }),
      );
   });
});
