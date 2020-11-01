/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ProcessingInstructionPToken } from 'pToken';
import { strOrBlank } from 'sToken';

const PROCESSING_INSTRUCTION_XTOKEN = 'PROCESSING_INSTRUCTION_XTOKEN';

class ProcessingInstructionXToken {
   public readonly type: typeof PROCESSING_INSTRUCTION_XTOKEN = PROCESSING_INSTRUCTION_XTOKEN;

   public readonly target: string;

   public readonly instruction: string;

   public readonly pToken?: ProcessingInstructionPToken;

   constructor(pToken: ProcessingInstructionPToken);
   constructor(target: string, instruction?: string);
   constructor(targetOrPToken: string | ProcessingInstructionPToken, instruction?: string) {
      if (typeof targetOrPToken === 'string') {
         this.target = targetOrPToken;
         this.instruction = instruction || '';
      } else {
         this.target = strOrBlank(targetOrPToken.target);
         this.instruction = strOrBlank(targetOrPToken.instruction);
         this.pToken = targetOrPToken;
      }
   }
}

export { PROCESSING_INSTRUCTION_XTOKEN, ProcessingInstructionXToken };
