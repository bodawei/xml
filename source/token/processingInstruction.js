/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import {
   textOrBlank,
} from './common/misc.js';
import * as instruction from './bridge/instruction.js';
import * as base from './base.js';

/**********************************************************************\
 The processingInstruction namespace has the usual parsing etc
 routines for dealing with processing instructions.
\**********************************************************************/

const WFEID = WellFormedError.ID;
const PROCESSING_INSTRUCTION = 'PROCESSING_INSTRUCTION';

class ProcessingInstruction extends base.XToken {

   constructor(target, instruction, sTokens) {
      super(sTokens);

      this.target = target;
      this.instruction = instruction;
   }

}

class ProcessingInstructionPToken extends base.PToken {
   constructor(props) {
      super(PROCESSING_INSTRUCTION, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(this.instruction,
         this.close);

      return results;
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
    [16] PI       ::=  '<?' PITarget (S (Char* - (Char* '?>' Char*)))? '?>'
    [17] PITarget ::=  Name - (('X' | 'x') ('M' | 'm') ('L' | 'l'))
\**********************************************************************/

function parse(source, instructionPToken, deliverPToken) {
   const pToken = new instruction.PToken(PROCESSING_INSTRUCTION, instructionPToken);

   source.extractToObject('all', [ '?>' ], pToken, 'instruction');
   source.extract('match', '?>', (sToken) => {
      pToken.close = sToken;
      deliverPToken(pToken);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken, ec, entityMetaData) {
   instruction.checkWellFormed(pToken, ec, entityMetaData);

   ec.setPos(pToken.instruction);
   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.PI_NO_CLOSE, [ textOrBlank(pToken.target) ]);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken) {
   return new ProcessingInstruction(textOrBlank(pToken.target),
      textOrBlank(pToken.instruction), pToken);
}

export {
   PROCESSING_INSTRUCTION as PTYPE,
   ProcessingInstructionPToken as PToken,
   ProcessingInstruction as XToken,
   parse,
   checkWellFormed,
   pTokenToXToken,
};
