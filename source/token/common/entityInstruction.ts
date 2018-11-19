/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { WellFormedError, ErrorCollector } from 'error';
import { SToken, STokenSource, STokenArrayBuilder } from 'sToken';

import { InstructionStart } from '../bridge/instruction';
import { checkWellFormedText, textOrBlank } from './misc';
import literal from './literal';
import { TEXT_PTOKEN } from '../text';

/**********************************************************************\
 An EntityInstruction is actually just the very common parts that
 are the same between an XmlDeclaration and a TextDeclaration.
\**********************************************************************/

const DECL_NAME_TERMINATORS = [ '=', '?>' ];

type EntityInstructionParam = {
   readonly name: SToken;
   readonly nameSpace?: SToken;
   readonly equal?: SToken;
   readonly equalSpace?: SToken;
   readonly openQuote?: SToken;
   readonly value?: SToken;
   readonly closeQuote?: SToken;
   readonly valueSpace?: SToken;
};

class EntityInstruction {
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly target?: SToken;
   public readonly targetSpace?: SToken;
   public readonly params: ReadonlyArray<EntityInstructionParam> = [];
   public readonly close?: SToken;

   constructor(param: InstructionStart | EntityInstruction) {
      Object.assign(this, param);
      this.open = param.open;
      this.params = this.params;
   }
}

type DeliverParams = (result?: Array<EntityInstructionParam>) => void;

/**********************************************************************\
 parseEntityInstruction() extracts the STokens of an XML Declaration.

 This assumes that the "<?xml " has already been processed, and those
 STokens are passed in through instStart.

 PARAM
 source: A STokenSource to read from
 instStart: The portion of the data already parsed into an InstructionStart
 paramNames: An array of the legal names of parameters
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

function parseEntityInstruction(source: STokenSource, instStart: InstructionStart, paramNames: Array<string>, deliverPToken: (result: EntityInstruction) => void) {
   const protoToken: any = Object.assign({}, instStart);

   getNextParam(source, [], paramNames, (params) => {
      protoToken.params = params;
      source.extract('match', '?>', (sToken) => {
         protoToken.close = sToken;
         deliverPToken(protoToken);
      });
   });
}

function getNextParam(source: STokenSource, attrs: Array<EntityInstructionParam>, paramNames: Array<string>, deliverPToken: DeliverParams) {
   source.extract('peekWord', DECL_NAME_TERMINATORS, (sToken) => {
      const word = textOrBlank(sToken).toLowerCase();
      if (!sToken || paramNames.indexOf(word) === -1) {
         deliverPToken(attrs);
         return;
      }

      addParam(source, attrs, sToken, paramNames, deliverPToken);
   });
}

function addParam(source: STokenSource, attrs: Array<EntityInstructionParam>, name: SToken, paramNames: Array<string>, deliverPToken: DeliverParams) {
   const attr = {
      name: name,
   };
   attrs.push(attr);
   
   source.extractToObject('word', DECL_NAME_TERMINATORS, attr, 'name');
   source.extractToObjectNoParams('space', attr, 'nameSpace');
   source.extractToObject('match', '=', attr, 'equal');
   source.extractToObjectNoParams('space', attr, 'equalSpace');
   literal.parse(source, {
      pToken: attr,
   }, (modifiedAttr) => {
      if (modifiedAttr) {
         source.extractToObjectNoParams('space', attr, 'valueSpace');

         // We'll only ever get (at most) one TextPToken from literal, since we pass in no reference types
         const literalPToken = modifiedAttr.value[0];

         if (literalPToken && literalPToken.type === TEXT_PTOKEN) {
            (attr as any).value = literalPToken.text;
         } else {
            delete (attr as any).value;
         }
      }
   
      getNextParam(source, attrs, paramNames, deliverPToken);
   });
}

/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the STokens
\**********************************************************************/

function sTokensFromPToken(pToken: EntityInstruction): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open,
      pToken.openSpace,
      pToken.target,
      pToken.targetSpace);

   for (const param of pToken.params) {
      builder.add(
         param.name,
         param.nameSpace,
         param.equal,
         param.equalSpace,
         param.openQuote,
         param.value,
         param.closeQuote,
         param.valueSpace);
   }
   
   builder.add(pToken.close);

   return builder.sTokenArray;
}

export {
   EntityInstructionParam,
   EntityInstruction,

   parseEntityInstruction,
   sTokensFromPToken,
}
