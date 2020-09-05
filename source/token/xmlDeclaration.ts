/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { strOrBlank, SToken, STokenSource } from 'sToken';

import { InstructionStart } from './bridge/instruction';
import { sTokensFromPToken, EntityInstructionParam, parseEntityInstruction } from './common/entityInstruction';

/**********************************************************************\
 The xmlDeclaration namespace contains the usual routines for parsing,
 validating and tokenizing an XML Declaration.
\**********************************************************************/

const XMLDECL_PTOKEN = 'XMLDECL_PTOKEN';

const PARAM_NAMES = [ 'version', 'encoding', 'standalone' ];

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

export {
   XMLDECL_PTOKEN,
   XmlDeclarationPToken,

   parseXmlDeclaration,
};
