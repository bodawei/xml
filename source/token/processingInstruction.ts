/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError } from '../error';
import { SToken, STokenSource, STokenArrayBuilder } from '../sToken';

import {
   textOrBlank,
} from './common/misc.js';
import * as instruction from './bridge/instruction.js';

const WFEID = WellFormedError.ID;
const PROCESSING_INSTRUCTION_PTOKEN = 'PROCESSING_INSTRUCTION';
const PROCESSING_INSTRUCTION_XTOKEN = 'PROCESSING_INSTRUCTION_XTOKEN';

type DeliverPToken = (pToken: ProcessingInstructionPToken) => void;

class ProcessingInstructionXToken {
   public readonly type: typeof PROCESSING_INSTRUCTION_XTOKEN = PROCESSING_INSTRUCTION_XTOKEN;
   public readonly target: string;
   public readonly instruction: string;
   public readonly pToken?: ProcessingInstructionPToken;

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(target: string, instruction: string, pToken?: ProcessingInstructionPToken) {
      this.target = target;
      this.instruction = instruction;
      this.pToken = pToken;
   }

}

class ProcessingInstructionPToken {
   public readonly type: typeof PROCESSING_INSTRUCTION_PTOKEN = PROCESSING_INSTRUCTION_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly target?: SToken;
   public readonly targetSpace?: SToken;
   public readonly instruction?: SToken;
   public readonly close?: SToken;

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(param: {open: SToken}) {
      Object.assign(this, param);
      this.open = param.open;
      this.type = PROCESSING_INSTRUCTION_PTOKEN;

      // Workaround until instruction redone
      this.openSpace = (param as any).openSpace;
      this.targetSpace = (param as any).targetSpace;
   }

   checkWellFormed(ec: ErrorCollector, emd: EntityMetaData):void {
      return checkWellFormed(this, ec, emd);
   }

   toXToken(): ProcessingInstructionXToken {
      return pTokenToXToken(this);
   }

   toSTokenArray(): Array<SToken> {
      return sTokensFromPToken(this);
   }
}

/**********************************************************************\
 parse() extracts the SToken's that make up an entity reference.

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

function parse(source: STokenSource, instr: { open: SToken }, deliverPToken: DeliverPToken) {
   const raw: any = Object.assign({}, instr);

   source.extractToObject('all', [ '?>' ], raw, 'instruction');
   source.extract('match', '?>', (sToken) => {
      raw.close = sToken;
      deliverPToken(new ProcessingInstructionPToken(raw));
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken: ProcessingInstructionPToken, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   instruction.checkWellFormed(pToken, ec, entityMetaData);

   ec.setPos(pToken.instruction);
   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.PI_NO_CLOSE, [ textOrBlank(pToken.target) ]);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: ProcessingInstructionPToken) {
   return new ProcessingInstructionXToken(textOrBlank(pToken.target),
      textOrBlank(pToken.instruction), pToken);
}

/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the STokens
\**********************************************************************/

function sTokensFromPToken(pToken: ProcessingInstructionPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open,
      pToken.openSpace,
      pToken.target,
      pToken.targetSpace,
      pToken.instruction,
      pToken.close);

   return builder.sTokenArray;
}

export {
   PROCESSING_INSTRUCTION_PTOKEN as PTYPE,
   PROCESSING_INSTRUCTION_XTOKEN as XTYPE,
   ProcessingInstructionXToken as XToken,

   parse as parseProcessingInstruction,

   PROCESSING_INSTRUCTION_PTOKEN,
   PROCESSING_INSTRUCTION_XTOKEN,
   ProcessingInstructionPToken,
   ProcessingInstructionXToken,
};
