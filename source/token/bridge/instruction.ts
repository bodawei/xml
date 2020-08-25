/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { EntityMetaData, EntityKind } from 'basic';
import { strOrBlank, SToken, STokenSource } from 'sToken';

import { ProcessingInstructionPToken, parseProcessingInstruction } from '../processingInstruction';
import { parseTextDeclaration, TextDeclarationPToken } from '../textDeclaration';
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
type DeliverInstruction = (section: ProcessingInstructionPToken | XmlDeclarationPToken | TextDeclarationPToken) => void;

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

function parseInstruction(source: STokenSource, openSToken: SToken, inDocument: boolean, deliverPToken: DeliverInstruction) {
   const start: InstructionStart = { open: openSToken };
   start.open = openSToken;

   source.extractToObjectNoParams('space', start, 'openSpace');
   source.extractToObject('word', [ '?>' ], start, 'target');

   source.extractNoParams('space', (sToken) => {
      start.targetSpace = sToken;
      const target = strOrBlank(start.target);

      if (target.toLocaleLowerCase() === 'xml') {
         if (inDocument) {
            parseXmlDeclaration(source, start, deliverPToken);
         } else {
            parseTextDeclaration(source, start, deliverPToken);
         }
      } else {
         parseProcessingInstruction(source, start, deliverPToken);
      }
   });
}

export {
   InstructionStart,

   parseInstruction,
};
