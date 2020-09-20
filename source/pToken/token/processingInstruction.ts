/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'sToken';

import { InstructionStart } from '../bridge/instruction';

const PROCESSING_INSTRUCTION_PTOKEN = 'PROCESSING_INSTRUCTION_PTOKEN';

type DeliverPToken = (pToken: ProcessingInstructionPToken) => void;

interface RawPI {
   open?: SToken;
   openSpace?: SToken;
   target?: SToken;
   targetSpace?: SToken;
   instruction?: SToken;
   close?: SToken;
}

class ProcessingInstructionPToken {
   public readonly type: typeof PROCESSING_INSTRUCTION_PTOKEN = PROCESSING_INSTRUCTION_PTOKEN;

   public readonly open: SToken;

   public readonly openSpace?: SToken;

   public readonly target?: SToken;

   public readonly targetSpace?: SToken;

   public readonly instruction?: SToken;

   public readonly close?: SToken;

   constructor(param: InstructionStart | ProcessingInstructionPToken, other: RawPI = {}) {
      this.open = other.open ?? param.open;
      this.openSpace = other.openSpace ?? param.openSpace;
      this.target = other.target ?? param.target;
      this.targetSpace = other.targetSpace ?? param.targetSpace;
      this.instruction =
         other.instruction ?? ('instruction' in param ? param.instruction : undefined);
      this.close = other.close ?? ('close' in param ? param.close : undefined);
   }
}

/**********************************************************************\
 parseProcessingInstruction() extracts the SToken's that make up an
 processing instruction.

 This depends on being passed InstructionStart, which is to say that
 open, and target must already have been read.

 SYNTAX
   §2.6.0
      [16] PI       ::=  '<?' PITarget (S (Char* - (Char* '?>' Char*)))? '?>'
      [17] PITarget ::=  Name - (('X' | 'x') ('M' | 'm') ('L' | 'l'))
   Lax
      [16] PI       ::=  '<?' S? PITarget (S (AnyChar* - (AnyChar* '?>' AnyChar*)))? '?>'
      [17] PITarget ::=  Name
\**********************************************************************/

function parseProcessingInstruction(
   source: STokenSource,
   instr: InstructionStart,
   deliverPToken: DeliverPToken,
): void {
   const raw: RawPI = {};

   source.extractToObject('all', ['?>'], raw, 'instruction');
   source.extract('match', '?>', (sToken) => {
      raw.close = sToken;
      deliverPToken(new ProcessingInstructionPToken(instr, raw));
   });
}

export { PROCESSING_INSTRUCTION_PTOKEN, ProcessingInstructionPToken, parseProcessingInstruction };
