/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError, XmlWarning, ErrorCollector } from '../../error';

import misc from '../common/misc';
import base from '../base';
import { SToken, STokenSource } from 'sToken';
import { EntityMetaData } from 'basic';

/**********************************************************************\
 The instruction namespace has routines for parsing and checking
 the initial contents of an XML or Text Declaration or a processing
 instruction.
\**********************************************************************/

const WARN = XmlWarning.ID;
const WFEID = WellFormedError.ID;
const INSTRUCTION = 'INSTRUCTION';
const INSTRUCTION_XTOKEN = 'INSTRUCTION_XTOKEN';

class InstructionToken extends base.XToken {
   public target: string;

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(target: string, pToken?: InstructionPToken) {
      super(INSTRUCTION_XTOKEN, pToken);

      this.target = target;
   }

}

class InstructionPToken extends base.PToken {
   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(type: string, props?: Object) {
      super(type || INSTRUCTION, props);
      // fix processingInstruction
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

function parse(source: STokenSource, openSToken: SToken, deliverPToken: (result: InstructionPToken) => void) {
   const pToken = new InstructionPToken('');
   pToken.open = openSToken;

   source.extractToObjectNoParams('space', pToken, 'postOpenSpace');
   source.extractToObject('word', [ '?>' ], pToken, 'target');

   source.extractNoParams('space', (sToken) => {
      pToken.postTargetSpace = sToken;
      deliverPToken(pToken);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken: InstructionPToken, ec: ErrorCollector, entityMetaData: EntityMetaData, xmlOk: boolean = false) {
   // Note: This is now only being used by xml declaration.  instruction should just vanish as a pseudo type
   // Maybe the othe generic markup should vanish too.
   ec.setPos(pToken.open);
   ec.setPos(pToken.postOpenSpace);
   ec.check(pToken.postOpenSpace, WFEID.PI_SPACE_AFTER_OPEN, [ misc.textOrBlank(pToken.target) ]);

   ec.setPos(pToken.target);
   ec.check(!pToken.target, WFEID.PI_NO_TARGET);
   misc.checkWellFormedText(pToken.target, ec, entityMetaData);

   if (!xmlOk) {
      misc.checkWellFormedNameRecommendation(pToken.target, ec, entityMetaData, 'PI',
         WARN.PI_TARGET_XMLDASH_RESERVED, WARN.PI_TARGET_XML_RESERVED);
   }

   ec.setPos(pToken.postTargetSpace);
   ec.check(!pToken.postTargetSpace, WFEID.PI_NO_SPACE_AFTER_TARGET, [ misc.textOrBlank(pToken.target) ]);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into a token.
\**********************************************************************/

// Does this even make sense?  Won't this just be a processinginstruction by default?
function pTokenToXToken(pToken: InstructionPToken) {
   return new InstructionToken(misc.textOrBlank(pToken.target), pToken);
}

export {
   INSTRUCTION as PTYPE,
   INSTRUCTION_XTOKEN as XTYPE,
   InstructionPToken as PToken,
   InstructionToken as XToken,
   parse,
   checkWellFormed,
   pTokenToXToken,

   InstructionPToken,
};
