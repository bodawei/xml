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
      this.open = other.open || base.open;
      this.openSpace = other.openSpace || base.openSpace;
      this.target = other.target || base.target;
      this.targetSpace = other.targetSpace || base.targetSpace;
      this.fields = other.fields || ('fields' in base ? base.fields : []);
      this.close = other.close || ('close' in base ? base.close : undefined);
   }
}

type DeliverParams = (result?: Array<InstructionField>) => void;

function addField(
   source: STokenSource,
   attrs: Array<InstructionField>,
   name: SToken,
   allowedFieldNames: Array<string>,
   deliverPToken: DeliverParams,
): void {
   const attr: RawInstructionField = {
      name: name,
   };
   attrs.push(attr);

   source.extractToObject('word', DECL_NAME_TERMINATORS, attr, 'name');
   source.extractToObjectNoParams('space', attr, 'nameSpace');
   source.extractToObject('match', '=', attr, 'equal');
   source.extractToObjectNoParams('space', attr, 'equalSpace');
   literal.parse(
      source,
      {
         pToken: attr,
      },
      (modifiedAttr) => {
         if (modifiedAttr) {
            source.extractToObjectNoParams('space', attr, 'valueSpace');

            // We'll only ever get (at most) one TextPToken from literal, since we pass in no reference types
            const literalPToken = modifiedAttr.value[0];

            if (literalPToken && literalPToken.type === TEXT_PTOKEN) {
               attr.value = literalPToken.text;
            }
         }

         // eslint-disable-next-line @typescript-eslint/no-use-before-define
         getNextField(source, attrs, allowedFieldNames, deliverPToken);
      },
   );
}

function getNextField(
   source: STokenSource,
   attrs: Array<InstructionField>,
   allowedFieldNames: Array<string>,
   deliverPToken: DeliverParams,
) {
   source.extract('peekWord', DECL_NAME_TERMINATORS, (sToken) => {
      const word = strOrBlank(sToken).toLowerCase();
      if (!sToken || allowedFieldNames.indexOf(word) === -1) {
         deliverPToken(attrs);
         return;
      }

      addField(source, attrs, sToken, allowedFieldNames, deliverPToken);
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
   allowedFieldNames: Array<string>,
   deliverPToken: (result: FieldedInstruction) => void,
): void {
   const props: RawFieldedInstruction = {};

   getNextField(source, [], allowedFieldNames, (fields) => {
      props.fields = fields;
      source.extract('match', '?>', (sToken) => {
         props.close = sToken;
         deliverPToken(new FieldedInstruction(instStart, props));
      });
   });
}

export { InstructionField, FieldedInstruction, parseFieldedInstruction };
