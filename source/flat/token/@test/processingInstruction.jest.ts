/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ProcessingInstructionPToken } from 'pToken';
import { toSToken } from 'sToken';

import { processingInstructionToSTokens } from '../processingInstructionToSTokens';

describe('processingInstructionToSTokens() (unit)', () => {
   it('returns all the STokens', () => {
      const protoPToken = {
         open: toSToken('open'),
         openSpace: toSToken(' '),
         target: toSToken('target'),
         targetSpace: toSToken('\t'),
         instruction: toSToken('blah'),
         close: toSToken('?>'),
      };
      const piPToken = new ProcessingInstructionPToken(protoPToken);

      expect(processingInstructionToSTokens(piPToken)).toEqual([
         piPToken.open,
         piPToken.openSpace,
         piPToken.target,
         piPToken.targetSpace,
         piPToken.instruction,
         piPToken.close,
      ]);
   });
});
