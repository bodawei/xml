/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import {  WellFormedError,  } from 'error';
import {  SToken, STokenSource,  } from 'sToken';

import { InstructionStart } from '../pToken/bridge/instruction';

const WFEID = WellFormedError.ID;
const PROCESSING_INSTRUCTION_PTOKEN = 'PROCESSING_INSTRUCTION_PTOKEN';

type DeliverPToken = (pToken: ProcessingInstructionPToken) => void;


class ProcessingInstructionPToken {
   public readonly type: typeof PROCESSING_INSTRUCTION_PTOKEN = PROCESSING_INSTRUCTION_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly target?: SToken;
   public readonly targetSpace?: SToken;
   public readonly instruction?: SToken;
   public readonly close?: SToken;

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(param: {open: SToken} | ProcessingInstructionPToken) {
      Object.assign(this, param);
      this.open = param.open;
      this.type = PROCESSING_INSTRUCTION_PTOKEN;

      // Workaround until instruction redone
      this.openSpace = (param as any).openSpace || (param as any).postOpenSpace;
      this.targetSpace = (param as any).targetSpace;
   }
}

/**********************************************************************\
 parseProcessingInstruction() extracts the SToken's that make up an
 entity reference.

 This depends on being passed an instruction PToken (and with the
 corresponding text already processed).

 PARAM
 source: A STokenSource to read from
 deliverPToken: Callback to deliver the PTokens

 SYNTAX
   §2.6.0
      [16] PI       ::=  '<?' PITarget (S (Char* - (Char* '?>' Char*)))? '?>'
      [17] PITarget ::=  Name - (('X' | 'x') ('M' | 'm') ('L' | 'l'))
   Lax
      [16] PI       ::=  '<?' S? PITarget (S (Char* - (Char* '?>' Char*)))? '?>'
      [17] PITarget ::=  Name
\**********************************************************************/

function parseProcessingInstruction(source: STokenSource, instr: InstructionStart, deliverPToken: DeliverPToken) {
   const raw: any = Object.assign({}, instr);

   source.extractToObject('all', [ '?>' ], raw, 'instruction');
   source.extract('match', '?>', (sToken) => {
      raw.close = sToken;
      deliverPToken(new ProcessingInstructionPToken(raw));
   });
}

export {
   PROCESSING_INSTRUCTION_PTOKEN,
   ProcessingInstructionPToken,

   parseProcessingInstruction,
};
