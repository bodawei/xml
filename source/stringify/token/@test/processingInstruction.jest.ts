/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ProcessingInstructionPToken } from 'pToken';
import { toSToken, SToken } from 'sToken';

import { processingInstructionToStokens } from '../processingInstructionToStokens';

describe('processingInstructionToStokens() (unit)', () => {
   it('returns all the STokens', () => {
      const protoPToken = {
         open: toSToken('open'),
         openSpace: toSToken(' '),
         instruction: toSToken('blah'),
         close: toSToken('?>'),
      };
      const piPToken = new ProcessingInstructionPToken(protoPToken);

      expect(processingInstructionToStokens(piPToken)).toEqual([
         piPToken.open,
         piPToken.openSpace,
         piPToken.instruction,
         piPToken.close,
      ] as Array<SToken>);
   });
});
