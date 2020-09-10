/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { strOrBlank, SToken, STokenSource, STokenArrayBuilder } from 'sToken';

import {
   checkName,
   checkCharWellFormed,
   checkWellFormedNameRecommendation,
} from './common/misc';
import { InstructionStart } from './bridge/instruction';

const WFEID = WellFormedError.ID;
const PROCESSING_INSTRUCTION_PTOKEN = 'PROCESSING_INSTRUCTION_PTOKEN';
const PROCESSING_INSTRUCTION_XTOKEN = 'PROCESSING_INSTRUCTION_XTOKEN';

type DeliverPToken = (pToken: ProcessingInstructionPToken) => void;

class ProcessingInstructionXToken {
   public readonly type: typeof PROCESSING_INSTRUCTION_XTOKEN = PROCESSING_INSTRUCTION_XTOKEN;
   public readonly target: string;
   public readonly instruction: string;
   public readonly pToken?: ProcessingInstructionPToken;

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
   constructor(param: {open: SToken} | ProcessingInstructionPToken) {
      Object.assign(this, param);
      this.open = param.open;
      this.type = PROCESSING_INSTRUCTION_PTOKEN;

      // Workaround until instruction redone
      this.openSpace = (param as any).openSpace || (param as any).postOpenSpace;
      this.targetSpace = (param as any).targetSpace;
   }

   checkWellFormed(ec: ErrorCollector, confVer: ConformanceVersion): void {
      return checkWellFormed(this, ec, confVer);
   }

   toXToken(): ProcessingInstructionXToken {
      return pTokenToXToken(this);
   }

   toSTokenArray(): Array<SToken> {
      return sTokensFromPToken(this);
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

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken: ProcessingInstructionPToken, ec: ErrorCollector, confVer: ConformanceVersion) {
   const targetName = strOrBlank(pToken.target);
   const lcTarget = targetName.toLowerCase();
   const hasXml = lcTarget.indexOf('xml') !== -1;

   ec.setPos(pToken.open);
   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.PI_SPACE_AFTER_OPEN, [ targetName ]);

   ec.setPos(pToken.target);
   ec.check(!pToken.target, WFEID.PI_NO_TARGET);
   checkName(pToken.target, ec, confVer, WFEID.PI_TARGET_NAME_INVALID);
   ec.check(hasXml, WFEID.PI_TARGET_HAS_XML, [ targetName ]);
   checkWellFormedNameRecommendation(pToken.target, ec, confVer, 'PI',
      XmlWarning.ID.PI_TARGET_XMLDASH_RESERVED, XmlWarning.ID.PI_TARGET_XML_RESERVED);

   ec.setPos(pToken.targetSpace);
   if (pToken.instruction) {
      ec.check(!pToken.targetSpace, WFEID.PI_NO_SPACE_AFTER_TARGET, [ targetName ]);
   }

   ec.setPos(pToken.instruction);
   checkCharWellFormed(pToken.instruction, ec, confVer);
   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.PI_NO_CLOSE, [ targetName ]);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: ProcessingInstructionPToken) {
   return new ProcessingInstructionXToken(strOrBlank(pToken.target),
      strOrBlank(pToken.instruction), pToken);
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
   PROCESSING_INSTRUCTION_PTOKEN,
   PROCESSING_INSTRUCTION_XTOKEN,
   ProcessingInstructionPToken,
   ProcessingInstructionXToken,

   parseProcessingInstruction,
};
