/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { strOrBlank, SToken, STokenSource } from 'sToken';
import { TEXT_PTOKEN } from 'token';

import { InstructionStart } from '../bridge/instruction';
import literal from '../../token/common/literal';

/**********************************************************************\
 An FieldedInstruction is actually just the very common parts that
 are the same between an XmlDeclaration and a TextDeclaration.
\**********************************************************************/

const DECL_NAME_TERMINATORS = ['=', '?>'];

interface RawInstructionField {
   name: SToken;
   nameSpace?: SToken;
   equal?: SToken;
   equalSpace?: SToken;
   openQuote?: SToken;
   value?: SToken;
   closeQuote?: SToken;
   valueSpace?: SToken;
}

interface RawFieldedInstruction {
   open?: SToken;
   openSpace?: SToken;
   target?: SToken;
   targetSpace?: SToken;
   fields?: ReadonlyArray<InstructionField>;
   close?: SToken;
}

interface InstructionField {
   readonly name: SToken;
   readonly nameSpace?: SToken;
   readonly equal?: SToken;
   readonly equalSpace?: SToken;
   readonly openQuote?: SToken;
   readonly value?: SToken;
   readonly closeQuote?: SToken;
   readonly valueSpace?: SToken;
}

class FieldedInstruction {
   public readonly open: SToken;

   public readonly openSpace?: SToken;

   public readonly target?: SToken;

   public readonly targetSpace?: SToken;

   public readonly fields: ReadonlyArray<InstructionField> = [];

   public readonly close?: SToken;

   constructor(base: InstructionStart | FieldedInstruction, other: RawFieldedInstruction = {}) {
      this.open = other.open ?? base.open;
      this.openSpace = other.openSpace ?? base.openSpace;
      this.target = other.target ?? base.target;
      this.targetSpace = other.targetSpace ?? base.targetSpace;
      this.fields = other.fields ?? ('fields' in base ? base.fields : []);
      this.close = other.close ?? ('close' in base ? base.close : undefined);
   }
}

type DeliverField = (result?: Array<InstructionField>) => void;
type DeliverInstruction = (result: FieldedInstruction) => void;

function addField(
   source: STokenSource,
   attrs: Array<InstructionField>,
   name: SToken,
   allowedFieldNames: ReadonlyArray<string>,
   deliverPToken: DeliverField,
): void {
   const field: RawInstructionField = { name };
   attrs.push(field);

   source.extractToObject('word', DECL_NAME_TERMINATORS, field, 'name');
   source.extractToObjectNoParams('space', field, 'nameSpace');
   source.extractToObject('match', '=', field, 'equal');
   source.extractToObjectNoParams('space', field, 'equalSpace');
   literal.parse(source, undefined, (literal) => {
      field.openQuote = literal?.openQuote;
      field.closeQuote = literal?.closeQuote;
      field.valueSpace = undefined;
      const literalPToken = literal?.value[0];

      if (literalPToken?.type === TEXT_PTOKEN) {
         field.value = literalPToken.text;
      }

      if (literal) {
         source.extractToObjectNoParams('space', field, 'valueSpace');
      }

      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      getNextField(source, attrs, allowedFieldNames, deliverPToken);
   });
}

function getNextField(
   source: STokenSource,
   fields: Array<InstructionField>,
   allowedFieldNames: ReadonlyArray<string>,
   deliverFields: DeliverField,
) {
   source.extract('peekWord', DECL_NAME_TERMINATORS, (sToken) => {
      const word = strOrBlank(sToken).toLowerCase();

      if (!sToken || allowedFieldNames.indexOf(word) === -1) {
         deliverFields(fields);
         return;
      }

      addField(source, fields, sToken, allowedFieldNames, deliverFields);
   });
}

/**********************************************************************\
 parseFieldedInstruction() extracts the STokens of an XML Declaration.

 This assumes that the "<?xml " has already been processed, and those
 STokens are passed in through instStart.

 PARAM
 source: A STokenSource to read from
 instStart: The portion of the data already parsed into an InstructionStart
 allowedFieldNames: An array of the legal names of fields
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   §2.8
      [23] XMLDecl      ::= '<?xml' VersionInfo EncodingDecl?
                            SDDecl? S? '?>'
      [24] VersionInfo  ::= S 'version' Eq ("'" VersionNum "'" |
                            '"' VersionNum '"')
      [25] Eq           ::= S? '=' S?
      [26] VersionNum   ::= ([a-zA-Z0-9_.:] | '-')+   // 1.0/1-2
      [26] VersionNum   ::= '1.0'   // 1.0/3+
      [26] VersionNum   ::= '1.1'   // 1.1/*
      [32] SDDecl       ::= S 'standalone' Eq (("'" ('yes' | 'no')"'") |
                            ('"' ('yes' | 'no') '"'))
   §4.3.1
      [77] TextDecl     ::= '<?xml' VersionInfo? EncodingDecl S? '?>'
      [80] EncodingDecl ::= S 'encoding' Eq ('"' EncName '"' |
                            "'" EncName "'" )
      [81] EncName      ::= [A-Za-z] ([A-Za-z0-9._] | '-')*
   Lax:
      (xml, version, encoding, standalone are all any case
      [23] XMLDecl      ::= '<?' S? 'xml' (VersionInfo? | EncodingDecl?
                            | SDDecl? S?)+ '?>'
      [24] VersionInfo  ::= S 'version' Eq ("'" VersionNum "'" |
                            '"' VersionNum '"')
      [25] Eq           ::= S? '=' S?
      [26] VersionNum   ::= '1.0' | '1.1' | [^"]* | [^']*
      [32] SDDecl       ::= S 'standalone' Eq (("'" ('yes' | 'no')"'") |
                            ('"' ('yes' | 'no') '"'))
      [77] TextDecl     ::= '<?' S? 'xml' (VersionInfo? EncodingDecl)* S? '?>'
      [80] EncodingDecl ::= S 'encoding' Eq ('"' EncName '"' |
                            "'" EncName "'" )
      [81] EncName      ::= [^"]* | [^']*
\**********************************************************************/

function parseFieldedInstruction(
   source: STokenSource,
   instStart: InstructionStart,
   allowedFieldNames: ReadonlyArray<string>,
   deliverPToken: DeliverInstruction,
): void {
   getNextField(source, [], allowedFieldNames, (fields) => {
      source.extract('match', '?>', (close) => {
         deliverPToken(new FieldedInstruction(instStart, { fields, close }));
      });
   });
}

export { InstructionField, FieldedInstruction, parseFieldedInstruction };
