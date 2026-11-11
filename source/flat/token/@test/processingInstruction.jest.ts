/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ProcessingInstructionPToken } from 'pToken';
import { describe, expect, it } from 'vitest';

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
