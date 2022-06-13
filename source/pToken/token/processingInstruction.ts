/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'basic';

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

function isNotInstructionStart(
   item: InstructionStart | ProcessingInstructionPToken,
): item is ProcessingInstructionPToken {
   return 'instruction' in item || 'close' in item;
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
      this.openSpace = 'openSpace' in other ? other.openSpace : param.openSpace;
      this.target = 'target' in other ? other.target : param.target;
      this.targetSpace = 'targetSpace' in other ? other.targetSpace : param.targetSpace;

      if (isNotInstructionStart(param)) {
         this.instruction = param.instruction;
         this.close = param.close;
      }

      this.instruction = 'instruction' in other ? other.instruction : this.instruction;
      this.close = 'close' in other ? other.close : this.close;
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
   source.extractToObject('match', '?>', raw, 'close');
   source.check(() => {
      deliverPToken(new ProcessingInstructionPToken(instr, raw));
   });
}

export { PROCESSING_INSTRUCTION_PTOKEN, ProcessingInstructionPToken, parseProcessingInstruction };
