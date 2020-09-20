/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import {
   TextDeclarationPToken,
   XmlDeclarationPToken,
   parseXmlDeclaration,
   parseTextDeclaration,
} from 'pToken';
import { strOrBlank, SToken, STokenSource } from 'sToken';

import {
   ProcessingInstructionPToken,
   parseProcessingInstruction,
} from '../token/processingInstruction';

/**********************************************************************\
 instruction bridges input far enough to decide whether to do an
 XML or Text Declaration parsing, or parse a Processing Instruction.
\**********************************************************************/

interface InstructionStart {
   open: SToken;
   openSpace?: SToken;
   target?: SToken;
   targetSpace?: SToken;
}

type DeliverInstruction = (
   section: ProcessingInstructionPToken | XmlDeclarationPToken | TextDeclarationPToken,
) => void;

/**********************************************************************\
 parseInstruction() extracts a ProcessingInstructionPToken a
 TextDeclarationPToken, or an XmlDeclarationPToken, given a '<?' token.
 If 'name' isn't /xml/i then this assumes a processing instruction
 was intended.

 PARAM
 openSToken: the SToken for the opening <?
 inDocument: true if this is in the main document entity (used to
   distinguish whether to parse a TextDecl or an XmlDecl)

 SYNTAX
   §2.6 & §2.8
      instruction ::= '<?' name S
   Lax
      instruction ::= '<?' S? (AnyNonSpaceChar*)? S?
\**********************************************************************/

function parseInstruction(
   source: STokenSource,
   openSToken: SToken,
   inDocument: boolean,
   deliverPToken: DeliverInstruction,
): void {
   const start: InstructionStart = { open: openSToken };

   source.extractToObjectNoParams('space', start, 'openSpace');
   source.extractToObject('word', ['?>'], start, 'target');

   source.extractNoParams('space', (sToken) => {
      start.targetSpace = sToken;
      const target = strOrBlank(start.target);

      if (target.toLowerCase() !== 'xml') {
         parseProcessingInstruction(source, start, deliverPToken);
         return;
      }

      if (inDocument) {
         parseXmlDeclaration(source, start, deliverPToken);
      } else {
         parseTextDeclaration(source, start, deliverPToken);
      }
   });
}

export { InstructionStart, parseInstruction };
