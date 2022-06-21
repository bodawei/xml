/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { CharRefPToken, GeneralEntityReferencePToken, ParameterEntityReferencePToken, TextPToken } from 'pToken';
import { SToken, STokenSource } from 'basic';

import literal, { LiteralPToken } from './literal';
import { GeneralEntityEndPToken } from '../marker/generalEntityEnd';
import { GeneralEntityStartPToken } from '../marker/generalEntityStart';
import { ParameterEntityStartPToken } from '../marker/parameterEntityStart';
import { ParameterEntityEndPToken } from '../marker/parameterEntityEnd';

type ParseOptions = {
   geRef?: boolean;
   terminators?: Array<string>;
}

type AttrValue = Array<
   GeneralEntityStartPToken | GeneralEntityEndPToken | GeneralEntityReferencePToken | TextPToken | CharRefPToken
>;

interface AttributePToken extends LiteralPToken {
   name: SToken;
   postNameSpace?: SToken;
   equal?: SToken;
   postEqualSpace?: SToken;
   trailingSpace?: SToken;
};

type AttributeValueElement = TextPToken|CharRefPToken|GeneralEntityReferencePToken|GeneralEntityStartPToken|GeneralEntityEndPToken|ParameterEntityReferencePToken|ParameterEntityStartPToken|ParameterEntityEndPToken;
type AttributeValuePToken = Array<AttributeValueElement>;

type AttributesPToken = Array<AttributePToken>;
type DeliverPToken = (result?: AttributesPToken) => void;


/**********************************************************************\
 The attribute namespace contains the usual tools for processing
 attributes, both as found on XML Declarations and start and empty
 element tags.
\**********************************************************************/

/**********************************************************************\
 parse() extracts the pieces of an attribute.

 PARAM
 source: A STokenSource to read from
 options: Optional options that affect parsing. this includes:
   terminators: An array of strings that may be terminators of
   the names of attributes (this is usually [ '>' ])
 deliverPToken: Callback to deliver the PToken

 SYNTAX
    [41] Attribute    ::= Name Eq AttValue
    [10] AttValue     ::= '"' ([^<&"] | Reference)* '"' |
                          "'" ([^<&'] | Reference)* "'"
    [24] VersionInfo  ::= S 'version' Eq ("'" VersionNum "'" |
                                          '"' VersionNum '"')
    [25] Eq           ::= S? '=' S?
    [26] VersionNum   ::= '1.' [0-9]+
    [32] SDDecl       ::= S 'standalone' Eq (("'" ('yes' | 'no') "'") |
                                             ('"' ('yes' | 'no') '"'))
    [80] EncodingDecl ::= S 'encoding' Eq ('"' EncName '"' |
                                           "'" EncName "'" )
    [81] EncName      ::= [A-Za-z] ([A-Za-z0-9._] | '-')*
\**********************************************************************/

function parse(source: STokenSource, options: ParseOptions = {}, deliverPToken: DeliverPToken): void {
   const newOptions = {
      geRef: options.geRef,
      terminators: [ '=' ].concat(options.terminators || []),
   };
   getNextAttribute(source, newOptions, [], deliverPToken);
}

function getNextAttribute(source: STokenSource, options: ParseOptions, attrs: Array<AttributePToken>, deliverPToken: DeliverPToken) {
   source.extract('word', options.terminators, (sToken) => {
      if (!sToken) {
         deliverPToken(attrs);
      } else {
         addAttribute(source, attrs, options, sToken, deliverPToken);
      }
   });
}

function addAttribute(source: STokenSource, attrs: Array<AttributePToken>, options: ParseOptions, name: SToken, deliverPToken: DeliverPToken) {
   const attr: AttributePToken = {
      name,
      value: []
   };
   attrs.push(attr);

   source.extractToObject('space', attr, 'postNameSpace');
   source.extractToObject('match', '=', attr, 'equal');
   source.extractToObject('space', attr, 'postEqualSpace');
   literal.parse(source, {
      pToken: attr,
      geRef: options.geRef || false,
   }, (modifiedPToken) => {
      if (modifiedPToken) {
         source.extractToObject('space', attr, 'trailingSpace');
      }

      getNextAttribute(source, options, attrs, deliverPToken);
   });
}


const parseAttribute = parse;

const attribute = {
   parse,
   parseAttribute,
};

export default attribute;

export {
   AttrValue,
   AttributePToken,
   AttributeValuePToken,
   AttributeValueElement,
   AttributesPToken,
   parseAttribute,
};
