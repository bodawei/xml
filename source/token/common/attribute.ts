/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning,  } from 'error';
import { strOrBlank, SToken, STokenSource } from 'sToken';

import { TextXToken, isTextPToken, TextPToken } from '../text';

import { checkXmlLangWellFormed } from './langAttribute';
import misc from './misc';
import literal, { LiteralPToken } from './literal';
import { LiteralValuePToken } from './literalValue';
import { GeneralEntityEndPToken, GeneralEntityEndXToken } from '../marker/generalEntityEnd';
import { GeneralEntityStartPToken, GeneralEntityStartXToken } from '../marker/generalEntityStart';
import { ParameterEntityEndXToken } from '../marker/parameterEntityEnd';
import { ParameterEntityStartXToken } from '../marker/parameterEntityStart';
import { GeneralEntityReferencePToken, GeneralEntityReferenceXToken } from '../generalEntityReference';
import { CharRefPToken } from '../charRef';
import { CharRefXToken, ParameterEntityReferenceXToken } from 'xToken';

type ParseOptions = {
   geRef?: boolean;
   terminators?: Array<string>;
}

interface AttributePToken extends LiteralPToken {
   name: SToken;
   postNameSpace?: SToken;
   equal?: SToken;
   postEqualSpace?: SToken;
   trailingSpace?: SToken;
};

type AttributeValuePToken = Array<TextPToken|CharRefPToken|GeneralEntityReferencePToken|GeneralEntityStartPToken|GeneralEntityEndPToken>;
type AttributeValueXToken = Array<TextXToken|CharRefXToken|GeneralEntityReferenceXToken|ParameterEntityReferenceXToken|GeneralEntityStartXToken|GeneralEntityEndXToken|ParameterEntityStartXToken|ParameterEntityEndXToken>;

type AttributeXToken = {
   name: string;
   value: AttributeValueXToken,
}

type AttributesXToken = Array<AttributeXToken>;

type AttributesPToken = Array<AttributePToken>;
type DeliverPToken = (result?: AttributesPToken) => void;
type CheckAttValue = (name: SToken, value: LiteralValuePToken, ec: ErrorCollector, emd: EntityMetaData) => void;
type CheckAttName = (name: SToken, index: number, ec: ErrorCollector, emd: EntityMetaData) => void;


/**********************************************************************\
 The attribute namespace contains the usual tools for processing
 attributes, both as found on XML Declarations and start and empty
 element tags.
\**********************************************************************/

const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;

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

   source.extractToObjectNoParams('space', attr, 'postNameSpace');
   source.extractToObject('match', '=', attr, 'equal');
   source.extractToObjectNoParams('space', attr, 'postEqualSpace');
   literal.parse(source, {
      pToken: attr,
      geRef: options.geRef || false,
   }, (modifiedPToken) => {
      if (modifiedPToken) {
         source.extractToObjectNoParams('space', attr, 'trailingSpace');
      }

      getNextAttribute(source, options, attrs, deliverPToken);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pAttributes: AttributesPToken, ec: ErrorCollector, entityMetaData: EntityMetaData, preceedingSpace: SToken | void, type: string, checkName?: CheckAttName, checkValue?: CheckAttValue) {
   const seenAttrNames: { [ attrName: string ]: true } = {};

   for (let index = 0; index < pAttributes.length; index++) {
      const attr = pAttributes[index];
      const nameText = strOrBlank(attr.name);

      if (index === 0) {
         ec.setPos(preceedingSpace);
         ec.check(!preceedingSpace, WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME, [ nameText ]);
      } else {
         ec.setPos(pAttributes[index - 1].trailingSpace);
         ec.check(!pAttributes[index - 1].trailingSpace, WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME, [ nameText ]);
      }

      ec.setPos(attr.name);

      if (type === WFEID.NOUN_ATTRIBUTE) {
         // Well-formedness constraint: §3.1: Unique Att Spec
         //    An attribute name must not appear more than once in the same start-tag or empty-element tag.
         ec.check(seenAttrNames[nameText], WFEID.ATTRIBUTE_DUPLICATE_NAME, [ nameText ]);
         misc.checkWellFormedNameRecommendation(attr.name, ec, entityMetaData, 'ATTRIBUTE',
            WARN.ATTRIBUTE_NAME_XMLCOLON_RESERVED,
            WARN.ATTRIBUTE_NAME_XML_RESERVED);

         //
         // §2.12: Language Identification
         // The value of the xml:lang attribute must match a particular
         // set of syntactic constraints. Note that if the attribute value
         // has entity references, this won't do any checking.
         //
         if (attr.name.str.toLowerCase() === 'xml:lang') {
            checkXmlLangWellFormed(attr.value as any, ec, entityMetaData); // TypeHack
         }

         seenAttrNames[nameText] = true;
      }

      misc.checkName(attr.name, ec, entityMetaData, WFEID.ATTRIBUTE_INVALID_NAME);

      if (checkName) {
         checkName(attr.name, index, ec, entityMetaData);
      }

      ec.setPos(attr.postNameSpace);
      ec.setPos(attr.equal);
      ec.check(!attr.equal, WFEID.ATTRIBUTE_NO_EQUAL, [ nameText ]);
      ec.setPos(attr.postEqualSpace);

      literal.checkWellFormed(attr, ec, entityMetaData, type, () => {
         // Well-formedness constraint: §3.1: No < in Attribute Values
         //   The replacement text of any entity referred to directly or indirectly
         //   in an attribute value must not contain a <.
         //   (Note that while the text speaks of only the replacement text of
         //   entity values, the syntax of AttValue doesn't allow it anywhere).
         if (type === WFEID.NOUN_ATTRIBUTE && attr.value) {
            for (let index = 0; index < attr.value.length; index++) {
               const valuePart = attr.value[index];

               if (isTextPToken(valuePart)) {
                  if (valuePart.text && valuePart.text.str.indexOf('<') !== -1) {
                     ec.report(WFEID.ATTRIBUTE_INVALID_VALUE, [ nameText ]);
                  }
               }
            }
         }

         if (checkValue) {
            checkValue(attr.name, attr.value, ec, entityMetaData);
         }
      });
   }
}

/**********************************************************************\
 makeTokenCompatible() converts a pToken value into a form that
 can be inserted into a token.
\**********************************************************************/

function makeTokenCompatible(pAttributes: AttributesPToken = []) {
   const attrs: AttributesXToken = [];

   for (let index = 0; index < pAttributes.length; index++) {
      const attr = pAttributes[index];
      const value = literal.makeTokenCompatible(attr);
      const details: AttributeXToken = {
         name: strOrBlank(attr.name),
         value: value || [],
      };

      attrs.push(details);
   }

   return attrs;
}

function makeOneTokenCompatible(attributes: AttributesPToken = []) {
   const attrs: AttributesXToken = [];

   for (let index = 0; index < attributes.length; index++) {
      const attr = attributes[index];
      const value = literal.makeOneTokenCompatible(attr);
      const details: AttributeXToken = {
         name: strOrBlank(attr.name),
         value: value ? [ new TextXToken(value) ] : [],
      };

      attrs.push(details);
   }

   return attrs;
}

function getSTokens(attributes: AttributesPToken = []) {
   let results: Array<SToken> = [];

   for (let index = 0; index < attributes.length; index++) {
      const attr = attributes[index];

      results.push(attr.name);
      if (attr.postNameSpace) {
         results.push(attr.postNameSpace);
      }

      if (attr.equal) {
         results.push(attr.equal);
      }

      if (attr.postEqualSpace) {
         results.push(attr.postEqualSpace);
      }

      results = results.concat(literal.getSTokens(attr));

      if (attr.trailingSpace) {
         results.push(attr.trailingSpace);
      }
   }

   return results.filter(item => item);
}

const attribute = {
   parse,
   checkWellFormed,
   makeTokenCompatible,
   makeOneTokenCompatible,
   getSTokens,
};

export default attribute;

export {
   AttributePToken,
   AttributeXToken,
   AttributeValuePToken,
   AttributeValueXToken,
};
