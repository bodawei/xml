/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ProcessingInstructionPToken } from 'pToken';
import { SToken, STokenArrayBuilder } from 'sToken';

function processingInstructionToSTokens(pToken: ProcessingInstructionPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(
      pToken.open,
      pToken.openSpace,
      pToken.target,
      pToken.targetSpace,
      pToken.instruction,
      pToken.close,
   );

   return builder.sTokenArray;
}

export { processingInstructionToSTokens };
