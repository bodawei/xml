/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError, XmlWarning } from '../error';

import {
   pushNonBottom,
   textOrBlank,
} from './common/util.js';
import * as misc from './common/misc.js';
import { Token as XmlToken } from './xmlToken.js';

/**********************************************************************\
 The instruction namespace has routines for parsing and checking
 the initial contents of an XML or Text Declaration or a processing
 instruction.
\**********************************************************************/

const WARN = XmlWarning.ID;
const WFEID = WellFormedError.ID;
const INSTRUCTION = 'INSTRUCTION';

class InstructionToken extends XmlToken {

   constructor(target, lTokens) {
      super(lTokens);

      this.target = target;
   }

}

/**********************************************************************\
 parse() starts extracting an instruction (<?NAME S) and then returns
 taht value for the caller to decide what to do with it.

 PARAM
 source: A LTokenSource to read from
 openLToken: the LToken for <?
 deliverParsed: Callback to deliver the parsed lTokens

 SYNTAX
   instruction ::= '<?' name S
\**********************************************************************/

function parse(source, openLToken, deliverParsed) {
   const parsed = {
      type: INSTRUCTION,
      open: openLToken,
   };

   source.extractToObject('space', parsed, 'postOpenSpace');
   source.extractToObject('word', [ '?>' ], parsed, 'target');

   source.extract('space', (lToken) => {
      parsed.postTargetSpace = lToken;
      deliverParsed(parsed);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(parsed, ec, entityMetaData, xmlOk) {
   ec.setPos(parsed.open);
   ec.setPos(parsed.postOpenSpace);
   ec.check(parsed.postOpenSpace, WFEID.PI_SPACE_AFTER_OPEN, [ textOrBlank(parsed.target) ]);

   ec.setPos(parsed.target);
   ec.check(!parsed.target, WFEID.PI_NO_TARGET);
   misc.checkWellFormedText(parsed.target, ec, entityMetaData);

   if (!xmlOk) {
      misc.checkWellFormedNameRecommendation(parsed.target, ec, entityMetaData,
         WARN.PI_TARGET_XMLDASH_RESERVED, WARN.PI_TARGET_XML_RESERVED);
   }

   ec.setPos(parsed.postTargetSpace);
   ec.check(!parsed.postTargetSpace, WFEID.PI_NO_SPACE_AFTER_TARGET, [ textOrBlank(parsed.target) ]);
}

/**********************************************************************\
 makeToken() converts a parsed into a token.
\**********************************************************************/

function makeToken(parsed) {
   const results = [];

   appendLTokens(results, parsed);
   return new InstructionToken(textOrBlank(parsed.target), results);
}

function appendLTokens(results, parsed) {
   pushNonBottom(results, parsed.open);
   pushNonBottom(results, parsed.postOpenSpace);
   pushNonBottom(results, parsed.target);
   pushNonBottom(results, parsed.postTargetSpace);
}

/**********************************************************************\
 Converts the parsing returned by parse() into another type.
\**********************************************************************/

function retype(type, instructionParsing) {
   return {
      type: type,
      open: instructionParsing.open,
      postOpenSpace: instructionParsing.postOpenSpace,
      target: instructionParsing.target,
      postTargetSpace: instructionParsing.postTargetSpace,
   };
}

export {
   INSTRUCTION as TYPE,
   InstructionToken as Token,
   parse,
   checkWellFormed,
   makeToken,
   appendLTokens,
   retype,
};
