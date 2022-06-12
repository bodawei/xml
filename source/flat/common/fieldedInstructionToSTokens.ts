/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { FieldedInstruction } from 'pToken';
import { SToken } from 'sToken';
import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

function fieldedInstructionToSTokens(pToken: FieldedInstruction): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open, pToken.openSpace, pToken.target, pToken.targetSpace);

   for (const field of pToken.fields) {
      builder.add(
         field.name,
         field.nameSpace,
         field.equal,
         field.equalSpace,
         field.openQuote,
         field.value,
         field.closeQuote,
         field.valueSpace,
      );
   }

   builder.add(pToken.close);

   return builder.sTokenArray;
}

export { fieldedInstructionToSTokens };
