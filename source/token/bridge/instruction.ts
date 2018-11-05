/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'sToken';

import { textOrBlank } from '../common/misc';

import { ProcessingInstructionPToken, parseProcessingInstruction } from '../processingInstruction';
import { parseXmlDeclaration, XmlDeclarationPToken } from '../xmlDeclaration';

/**********************************************************************\
 The instruction namespace bridges input far enough to decide
 whether to do an XML or Text Declaration parsing, or parse a
 Processing Instruction.
\**********************************************************************/

type InstructionStart = {
   open: SToken,
   openSpace?: SToken,
   target?: SToken,
   targetSpace?: SToken,
};
type DeliverInstruction = (section: ProcessingInstructionPToken | XmlDeclarationPToken) => void;

/**********************************************************************\
 parseInstruction() extracts a ProcessingInstructionPToken or
 an XmlDeclarationPToken, given a '<?' token. If 'name' isn't /xml/i
 then this assumes a processing instruction was intended.

 PARAM
 source: A STokenSource to read from
 openSToken: the SToken for <?
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   §2.6 & §2.8
      instruction ::= '<?' name S
   Lax
      instruction ::= '<?' S? name? S?
\**********************************************************************/

function parseInstruction(source: STokenSource, openSToken: SToken, deliverPToken: DeliverInstruction) {
   const pToken: InstructionStart = { open: openSToken };
   pToken.open = openSToken;

   source.extractToObjectNoParams('space', pToken, 'openSpace');
   source.extractToObject('word', [ '?>' ], pToken, 'target');

   source.extractNoParams('space', (sToken) => {
      pToken.targetSpace = sToken;
      const target = textOrBlank(pToken.target);

      if (target.toLocaleLowerCase() === 'xml') {
         parseXmlDeclaration(source, pToken, deliverPToken);
      } else {
         parseProcessingInstruction(source, pToken, deliverPToken);
      }
   });
}

export {
   InstructionStart,

   parseInstruction,
};
