/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { WellFormedError, ErrorCollector } from 'error';
import { strOrBlank, SToken, STokenSource } from 'sToken';

import { InstructionStart } from './bridge/instruction';
import { checkCharWellFormed } from './common/misc';
import { sTokensFromPToken, EntityInstructionParam, parseEntityInstruction } from './common/entityInstruction';

/**********************************************************************\
 The xmlDeclaration namespace contains the usual routines for parsing,
 validating and tokenizing an XML Declaration.
\**********************************************************************/

const WFEID = WellFormedError.ID;
const XMLDECL_PTOKEN = 'XMLDECL_PTOKEN';
const XMLDECL_XTOKEN = 'XMLDECL_XTOKEN';

const PARAM_NAMES = [ 'version', 'encoding', 'standalone' ];
const ENCODING_REGEXP = /^[A-Za-z][-A-Za-z0-9._]*$/;
const DEFAULT_ENCODING = 'utf-8';

type XmlVersion = 1.0 | 1.1;

class XmlDeclarationXToken {
   public readonly type: typeof XMLDECL_XTOKEN = XMLDECL_XTOKEN;
   public readonly version: XmlVersion;
   public readonly encoding: string;
   public readonly standalone: boolean;
   public readonly pToken?: XmlDeclarationPToken;

   constructor(version: XmlVersion, encoding?: string, standalone?: boolean, pToken?: XmlDeclarationPToken) {
      this.version = version;
      this.encoding = encoding || DEFAULT_ENCODING;
      this.standalone = standalone || false;

      this.pToken = pToken;
   }
}

class XmlDeclarationPToken {
   public readonly type: typeof XMLDECL_PTOKEN = XMLDECL_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly target?: SToken;
   public readonly targetSpace?: SToken;
   public readonly params: ReadonlyArray<EntityInstructionParam> = [];
   public readonly close?: SToken;

   constructor(param: InstructionStart | XmlDeclarationPToken) {
      Object.assign(this, param);
      this.open = param.open;
      this.params = this.params;
   }

   checkWellFormed(ec: ErrorCollector, entityMetaData: EntityMetaData): void {
      checkWellFormed(this, ec, entityMetaData);
   }

   toXToken(): XmlDeclarationXToken {
      return pTokenToXToken(this);
   }

   toSTokenArray(): Array<SToken> {
      return sTokensFromPToken(this);
   }

   isStandalone(): boolean {
      for (const param of this.params) {
         const name = strOrBlank(param.name);
         const value = strOrBlank(param.value);

         if (name.toLowerCase() == 'standalone') {
            return value.toLowerCase() === 'yes';
         }
      }

      return false;
   }
}

/**********************************************************************\
 parse() extracts the STokens of an XML Declaration.

 This assumes that the "<?xml " has already been processed, and those
 STokens are passed in through instStart.

 PARAM
 source: A STokenSource to read from
 instStart: The portion of the data already parsed into an InstructionStart
 deliverPToken: Callback to deliver the PToken
\**********************************************************************/

function parseXmlDeclaration(source: STokenSource, instStart: InstructionStart, deliverPToken: (result: XmlDeclarationPToken) => void) {
   parseEntityInstruction(source, instStart, PARAM_NAMES, (protoToken) => {
      deliverPToken(new XmlDeclarationPToken(protoToken));
   });
}

/**********************************************************************\
 Do well formed checking on the PToken from the parse().
\**********************************************************************/

function checkWellFormed(pToken: XmlDeclarationPToken, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   ec.setPos(pToken.open);
   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.XMLDECL_SPACE_AFTER_OPEN);

   ec.setPos(pToken.target);
   checkCharWellFormed(pToken.target, ec, entityMetaData);
   if (pToken.target) {
      const target = strOrBlank(pToken.target);
      const lcTarget = target.toLowerCase();
      ec.check(target !== lcTarget, WFEID.XMLDECL_TARGET_INVALID_CASE, [ pToken.target.str ]);
   } else {
      ec.report(WFEID.XMLDECL_NO_TARGET);
   }

   ec.setPos(pToken.targetSpace);
   ec.check(!pToken.targetSpace, WFEID.XMLDECL_NO_SPACE_AFTER_TARGET);

   checkParameters(pToken.params, ec, entityMetaData);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.XMLDECL_NO_CLOSE);
}

function checkParameters(params: ReadonlyArray<EntityInstructionParam>, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   let foundVersion = false;
   let foundEncoding = false;
   let foundStandalone = false;
   let prevParam;

   for (const param of params) {
      const nameText = strOrBlank(param.name);
      const lcName = nameText.toLowerCase();
      const value = param.value;
      const valueText = strOrBlank(value);
      const lcValue = valueText.toLowerCase();

      ec.setPos(param.name);

      if (PARAM_NAMES.indexOf(lcName) !== -1) {
         ec.check(nameText !== lcName, WFEID.XMLDECL_PARAM_INVALID_CASE, [ lcName, nameText ]);
      }

      if (prevParam) {
         ec.check(!prevParam.valueSpace, WFEID.XMLDECL_NO_SPACE_BETWEEN_PARAMS, [ nameText ]);
      }

      switch (lcName) {
         case 'version':
            foundVersion = true;
            ec.check(foundEncoding || foundStandalone, WFEID.XMLDECL_VERSION_INVALID_ORDER);

            ec.setPos(param.nameSpace);
            ec.setPos(param.equal);
            ec.setPos(param.equalSpace);
            ec.setPos(param.openQuote);
            ec.setPos(value);
            checkCharWellFormed(value, ec, entityMetaData);
            ec.check(valueText !== '1.1' && valueText !== '1.0', WFEID.XMLDECL_VERSION_INVALD, [ valueText ]);
            break;
         case 'encoding':
            foundEncoding = true;
            ec.check(!foundVersion || foundStandalone, WFEID.XMLDECL_ENCODING_INVALID_ORDER);

            ec.setPos(param.nameSpace);
            ec.setPos(param.equal);
            ec.check(!param.equal, WFEID.XMLDECL_ENCODING_NO_EQUAL);
            ec.setPos(param.equalSpace);
            ec.setPos(param.openQuote);
            ec.setPos(value);
            checkCharWellFormed(value, ec, entityMetaData);
            ec.check(!valueText.match(ENCODING_REGEXP), WFEID.XMLDECL_ENCODING_INVALID, [ valueText ]);
            break;
         case 'standalone':
            foundStandalone = true;
            ec.check(!foundVersion, WFEID.XMLDECL_STANDALONE_INVALID_ORDER);

            ec.setPos(param.nameSpace);
            ec.setPos(param.equal);
            ec.setPos(param.equalSpace);
            ec.setPos(param.openQuote);
            ec.setPos(value);
            checkCharWellFormed(value, ec, entityMetaData);
            ec.check(lcValue !== 'no' && lcValue !== 'yes', WFEID.XMLDECL_STANDALONE_INVALID, [ valueText ]);
            ec.check(valueText !== lcValue, WFEID.XMLDECL_STANDALONE_INVALID_CASE, [ lcValue, valueText ]);
            break;
         default:
            ec.report(WFEID.XMLDECL_PARAM_UNKNOWN, [ nameText ]);
      }

      prevParam = param;
   }

   // No need to test if version was found. Either have encoding or standalone (error) or no params.
   ec.check(params.length === 0, WFEID.XMLDECL_NO_PARAMS);
}

/**********************************************************************\
 Convert a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: XmlDeclarationPToken) {
   let version: XmlVersion = 1.0;
   let encoding: string = DEFAULT_ENCODING;
   let standalone: boolean = pToken.isStandalone();

   for (const param of pToken.params) {
      const name = strOrBlank(param.name);
      const value = strOrBlank(param.value);

      switch (name.toLowerCase()) {
         case 'version':
            version = value === '1.1' ? 1.1 : 1.0;
            break;
         case 'encoding':
            encoding = value;
            break;
         case 'standalone':
            standalone = value.toLowerCase() === 'yes' ? true : false;
            break;
      }
   }

   return new XmlDeclarationXToken(version, encoding, standalone, pToken);
}

export {
   XMLDECL_PTOKEN,
   XMLDECL_XTOKEN,
   XmlDeclarationPToken,
   XmlDeclarationXToken,

   parseXmlDeclaration,
};
