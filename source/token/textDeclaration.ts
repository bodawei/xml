/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { WellFormedError, ErrorCollector } from 'error';
import { strOrBlank, SToken, STokenSource } from 'sToken';

import { InstructionStart } from './bridge/instruction';
import { checkCharWellFormed } from './common/misc';
import { EntityInstructionParam, parseEntityInstruction, sTokensFromPToken } from './common/entityInstruction';

/**********************************************************************\
 The xmlDeclaration namespace contains the usual routines for parsing,
 validating and tokenizing an XML Declaration.
\**********************************************************************/

const WFEID = WellFormedError.ID;
const TEXTDECL_PTOKEN = 'TEXTDECL_PTOKEN';

const PARAM_NAMES = [ 'version', 'encoding' ];
const ENCODING_REGEXP = /^[A-Za-z][-A-Za-z0-9._]*$/;

class TextDeclarationPToken {
   public readonly type: typeof TEXTDECL_PTOKEN = TEXTDECL_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly target?: SToken;
   public readonly targetSpace?: SToken;
   public readonly params: ReadonlyArray<EntityInstructionParam> = [];
   public readonly close?: SToken;

   constructor(param: InstructionStart | TextDeclarationPToken) {
      Object.assign(this, param);
      this.open = param.open;
      this.params = this.params;
   }

   checkWellFormed(ec: ErrorCollector, confVer: ConformanceVersion): void {
      checkWellFormed(this, ec, confVer);
   }

   toSTokenArray(): Array<SToken> {
      return sTokensFromPToken(this);
   }
}

/**********************************************************************\
 parse() extracts the STokens of a Text Declaration.

 This assumes that the "<?xml " has already been processed, and those
 STokens are passed in through instStart.

 PARAM
 source: A STokenSource to read from
 instStart: The portion of the data already parsed into an InstructionStart
 deliverPToken: Callback to deliver the PToken
\**********************************************************************/

function parseTextDeclaration(source: STokenSource, instStart: InstructionStart, deliverPToken: (result: TextDeclarationPToken) => void) {
   parseEntityInstruction(source, instStart, PARAM_NAMES, (protoToken) => {
      deliverPToken(new TextDeclarationPToken(protoToken));
   });
}

/**********************************************************************\
 Do well formed checking on the PToken from the parse().
\**********************************************************************/

function checkWellFormed(pToken: TextDeclarationPToken, ec: ErrorCollector, confVer: ConformanceVersion) {
   ec.setPos(pToken.open);
   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.TEXTDECL_SPACE_AFTER_OPEN);

   ec.setPos(pToken.target);
   checkCharWellFormed(pToken.target, ec, confVer);

   if (pToken.target) {
      const target = strOrBlank(pToken.target);
      const lcTarget = target.toLowerCase();
      ec.check(target !== lcTarget, WFEID.TEXTDECL_TARGET_INVALID_CASE, [ pToken.target.str ]);
   } else {
      ec.report(WFEID.TEXTDECL_NO_TARGET);
   }

   ec.setPos(pToken.targetSpace);
   ec.check(!pToken.targetSpace, WFEID.TEXTDECL_NO_SPACE_AFTER_TARGET);

   checkParameters(pToken.params, ec, confVer);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.TEXTDECL_NO_CLOSE);
}

function checkParameters(params: ReadonlyArray<EntityInstructionParam>, ec: ErrorCollector, confVer: ConformanceVersion) {
   let foundEncoding = false;

   for (const param of params) {
      const nameText = strOrBlank(param.name);
      const lcName = nameText.toLowerCase();
      const value = param.value;
      const valueText = strOrBlank(value);

      ec.setPos(param.name);
      ec.check(nameText !== lcName, WFEID.TEXTDECL_PARAM_INVALID_CASE, [ lcName, nameText ]);

      switch (lcName) {
         case 'version':
            ec.check(foundEncoding, WFEID.TEXTDECL_VERSION_INVALID_ORDER);

            ec.setPos(param.nameSpace);
            ec.setPos(param.equal);
            ec.setPos(param.equalSpace);
            ec.setPos(param.openQuote);
            ec.setPos(value);
            checkCharWellFormed(value, ec, confVer);
            ec.check(valueText !== '1.1' && valueText !== '1.0', WFEID.TEXTDECL_VERSION_INVALD, [ valueText ]);
            break;
         case 'encoding':
            foundEncoding = true;

            ec.setPos(param.nameSpace);
            ec.setPos(param.equal);
            ec.setPos(param.equalSpace);
            ec.setPos(param.openQuote);
            ec.setPos(value);
            checkCharWellFormed(value, ec, confVer);
            ec.check(!valueText.match(ENCODING_REGEXP), WFEID.TEXTDECL_ENCODING_INVALID, [ valueText ]);
            break;
      }
   }
}


export {
   TEXTDECL_PTOKEN,
   TextDeclarationPToken,

   parseTextDeclaration,
};
