/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { toSToken } from 'sToken';
import { ProcessingInstructionXToken } from '../processingInstructionXToken';
import { ProcessingInstructionPToken } from 'token';

describe('processingInstructionXToken() (unit)', () => {
   it('produces an xToken from a pToken', () => {
      const piPToken = new ProcessingInstructionPToken({
         open: toSToken('open'),
         openSpace: toSToken(' '),
         target: toSToken('TheTarget'),
         instruction: toSToken('blah'),
         close: toSToken('?>'),
      });

      expect(new ProcessingInstructionXToken(piPToken)).toEqual(
         jasmine.objectContaining({
            target: 'TheTarget',
            instruction: 'blah',
            pToken: piPToken,
         }),
      );
   });

   it('produces an xToken from a pToken without a target or instructions', () => {
      const piPToken = new ProcessingInstructionPToken({
         open: toSToken('open'),
         openSpace: toSToken(' '),
         close: toSToken('?>'),
      });

      expect(new ProcessingInstructionXToken(piPToken)).toEqual(
         jasmine.objectContaining({
            target: '',
            instruction: '',
            pToken: piPToken,
         }),
      );
   });

   it('produces a pToken with the provided values', () => {
      const piXToken = new ProcessingInstructionXToken('TheTarget2', 'blah2');

      expect(piXToken).toEqual(
         jasmine.objectContaining({
            target: 'TheTarget2',
            instruction: 'blah2',
         }),
      );
   });
});
