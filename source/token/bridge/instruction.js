/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError, XmlWarning } from '../../error';

import misc from '../common/misc.js';
import * as base from '../base.js';

/**********************************************************************\
 The instruction namespace has routines for parsing and checking
 the initial contents of an XML or Text Declaration or a processing
 instruction.
\**********************************************************************/

const WARN = XmlWarning.ID;
const WFEID = WellFormedError.ID;
const INSTRUCTION = 'INSTRUCTION';

class InstructionToken extends base.XToken {

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(target, pToken) {
      super(pToken);

      this.target = target;
   }

}

class InstructionPToken extends base.PToken {
   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(type, props) {
      super(type || INSTRUCTION, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(this.open,
         this.postOpenSpace,
         this.target,
         this.postTargetSpace);

      return results;
   }
}

/**********************************************************************\
 parse() starts extracting an instruction (<?NAME S) and then returns
 taht value for the caller to decide what to do with it.

 PARAM
 source: A STokenSource to read from
 openSToken: the SToken for <?
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   instruction ::= '<?' name S
\**********************************************************************/

function parse(source, openSToken, deliverPToken) {
   const pToken = new InstructionPToken();
   pToken.open = openSToken;

   source.extractToObject('space', pToken, 'postOpenSpace');
   source.extractToObject('word', [ '?>' ], pToken, 'target');

   source.extract('space', (sToken) => {
      pToken.postTargetSpace = sToken;
      deliverPToken(pToken);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken, ec, entityMetaData, xmlOk) {
   ec.setPos(pToken.open);
   ec.setPos(pToken.postOpenSpace);
   ec.check(pToken.postOpenSpace, WFEID.PI_SPACE_AFTER_OPEN, [ misc.textOrBlank(pToken.target) ]);

   ec.setPos(pToken.target);
   ec.check(!pToken.target, WFEID.PI_NO_TARGET);
   misc.checkWellFormedText(pToken.target, ec, entityMetaData);

   if (!xmlOk) {
      misc.checkWellFormedNameRecommendation(pToken.target, ec, entityMetaData,
         WARN.PI_TARGET_XMLDASH_RESERVED, WARN.PI_TARGET_XML_RESERVED);
   }

   ec.setPos(pToken.postTargetSpace);
   ec.check(!pToken.postTargetSpace, WFEID.PI_NO_SPACE_AFTER_TARGET, [ misc.textOrBlank(pToken.target) ]);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into a token.
\**********************************************************************/

function pTokenToXToken(pToken) {
   return new InstructionToken(misc.textOrBlank(pToken.target), pToken);
}

export {
   INSTRUCTION as PTYPE,
   InstructionPToken as PToken,
   InstructionToken as XToken,
   parse,
   checkWellFormed,
   pTokenToXToken,
};
