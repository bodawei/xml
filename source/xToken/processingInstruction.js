/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import {
   pushNonBottom,
   textOrBlank,
} from './common/util.js';
import * as instruction from './instruction.js';
import { Token as XmlToken } from './xmlToken.js';

/**********************************************************************\
 The processingInstruction namespace has the usual parsing etc
 routines for dealing with processing instructions.

 This depends on the preliminary part having been parsed by instruction.
\**********************************************************************/

const WFEID = WellFormedError.ID;
const PROCESSING_INSTRUCTION = 'PROCESSING_INSTRUCTION';

class ProcessingInstruction extends XmlToken {

   constructor(target, instruction, lTokens) {
      super(lTokens);

      this.target = target;
      this.instruction = instruction;
   }

}

/**********************************************************************\
 parse() extracts the LToken's that make up an entity reference.

 This assumes that the initial & has not been extracted yet.

 PARAM
 source: A LTokenSource to read from
 deliverParsed: Callback to deliver the parsed lTokens

 SYNTAX
    [16] PI       ::=  '<?' PITarget (S (Char* - (Char* '?>' Char*)))? '?>'
    [17] PITarget ::=  Name - (('X' | 'x') ('M' | 'm') ('L' | 'l'))
\**********************************************************************/

function parse(source, instructionParsing, deliverParsed) {
   const parsed = instruction.retype(PROCESSING_INSTRUCTION, instructionParsing);

   source.extractToObject('all', [ '?>' ], parsed, 'instruction');
   source.extract('match', '?>', (lToken) => {
      parsed.close = lToken;
      deliverParsed(parsed);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(parsed, ec, entityMetaData) {
   instruction.checkWellFormed(parsed, ec, entityMetaData);

   ec.setPos(parsed.instruction);
   ec.setPos(parsed.close);
   ec.check(!parsed.close, WFEID.PI_NO_CLOSE, [ textOrBlank(parsed.target) ]);
}

/**********************************************************************\
 makeToken() converts a parsed into a token.
\**********************************************************************/

function makeToken(parsed) {
   return new ProcessingInstruction(textOrBlank(parsed.target),
      textOrBlank(parsed.instruction), getLTokens(parsed));
}

function getLTokens(parsed) {
   const results = [];

   instruction.appendLTokens(results, parsed);

   pushNonBottom(results, parsed.instruction);
   pushNonBottom(results, parsed.close);

   return results;
}

export {
   PROCESSING_INSTRUCTION as TYPE,
   ProcessingInstruction as Token,
   parse,
   checkWellFormed,
   makeToken,
};
