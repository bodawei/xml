/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { strOrBlank, SToken, STokenSource } from 'sToken';

import { InstructionStart } from '../bridge/instruction';
import {
   InstructionField,
   parseFieldedInstruction,
   FieldedInstruction,
} from '../common/fieldedInstruction';

/**********************************************************************\
 The xmlDeclaration namespace contains the usual routines for parsing,
 validating and tokenizing an XML Declaration.
\**********************************************************************/

const XMLDECL_PTOKEN = 'XMLDECL_PTOKEN';

const PARAM_NAMES = ['version', 'encoding', 'standalone'];

interface RawXmlDeclaration {
   open?: SToken;
   openSpace?: SToken;
   target?: SToken;
   targetSpace?: SToken;
   fields?: ReadonlyArray<InstructionField>;
   close?: SToken;
}

class XmlDeclarationPToken {
   public readonly type: typeof XMLDECL_PTOKEN = XMLDECL_PTOKEN;

   public readonly open: SToken;

   public readonly openSpace?: SToken;

   public readonly target?: SToken;

   public readonly targetSpace?: SToken;

   public readonly fields: ReadonlyArray<InstructionField>;

   public readonly close?: SToken;

   constructor(
      base: InstructionStart | FieldedInstruction | XmlDeclarationPToken,
      other: RawXmlDeclaration = {},
   ) {
      this.open = other.open ?? base.open;
      this.openSpace = other.openSpace ?? base.openSpace;
      this.target = other.target ?? base.target;
      this.targetSpace = other.targetSpace ?? base.targetSpace;
      this.fields = other.fields ?? ('fields' in base ? base.fields : []);
      this.close = other.close ?? ('close' in base ? base.close : undefined);
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

function parseXmlDeclaration(
   source: STokenSource,
   instStart: InstructionStart,
   deliverPToken: (result: XmlDeclarationPToken) => void,
): void {
   parseFieldedInstruction(source, instStart, PARAM_NAMES, (protoToken) => {
      deliverPToken(new XmlDeclarationPToken(protoToken));
   });
}

function xmlDeclIsStandalone(decl: XmlDeclarationPToken): boolean {
   for (const field of decl.fields) {
      const name = strOrBlank(field.name);
      const value = strOrBlank(field.value);

      if (name.toLowerCase() === 'standalone') {
         return value.toLowerCase() === 'yes';
      }
   }

   return false;
}

export { XMLDECL_PTOKEN, XmlDeclarationPToken, parseXmlDeclaration, xmlDeclIsStandalone };
