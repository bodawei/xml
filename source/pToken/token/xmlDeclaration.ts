/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { strOrBlank, SToken, STokenSource } from 'sToken';

import { InstructionStart } from '../../token/bridge/instruction';
import {
   EntityInstructionParam,
   parseEntityInstruction,
   EntityInstruction,
} from '../../token/common/entityInstruction';

/**********************************************************************\
 The xmlDeclaration namespace contains the usual routines for parsing,
 validating and tokenizing an XML Declaration.
\**********************************************************************/

const XMLDECL_PTOKEN = 'XMLDECL_PTOKEN';

const PARAM_NAMES = ['version', 'encoding', 'standalone'];

class XmlDeclarationPToken {
   public readonly type: typeof XMLDECL_PTOKEN = XMLDECL_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly target?: SToken;
   public readonly targetSpace?: SToken;
   public readonly params: readonly EntityInstructionParam[];
   public readonly close?: SToken;

   constructor(param: InstructionStart | XmlDeclarationPToken | EntityInstruction) {
      this.open = param.open;
      this.openSpace = param.openSpace;
      this.target = param.target;
      this.targetSpace = param.targetSpace;

      if (isNotInstructionStart(param)) {
         this.params = param.params || [];
         this.close = param.close;
      } else {
         this.params = [];
      }
   }
}

function isNotInstructionStart(
   item: InstructionStart | XmlDeclarationPToken | EntityInstruction,
): item is XmlDeclarationPToken | EntityInstruction {
   return 'type' in item || 'params' in item;
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

function parseXmlDeclaration(
   source: STokenSource,
   instStart: InstructionStart,
   deliverPToken: (result: XmlDeclarationPToken) => void,
) {
   parseEntityInstruction(source, instStart, PARAM_NAMES, (protoToken) => {
      deliverPToken(new XmlDeclarationPToken(protoToken));
   });
}

function xmlDeclIsStandalone(decl: XmlDeclarationPToken): boolean {
   for (const param of decl.params) {
      const name = strOrBlank(param.name);
      const value = strOrBlank(param.value);

      if (name.toLowerCase() === 'standalone') {
         return value.toLowerCase() === 'yes';
      }
   }

   return false;
}

export { XMLDECL_PTOKEN, XmlDeclarationPToken, parseXmlDeclaration, xmlDeclIsStandalone };
