/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { WellFormedError, XmlWarning,  } from '../../error';

import text from '../text';

import misc from './misc.js';
import literal from './literal';

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

function parse(source, options = {}, deliverPToken) {
   const newOptions = {
      geRef: options.geRef,
      terminators: [ '=' ].concat(options.terminators || []),
   };
   getNextAttribute(source, newOptions, [], deliverPToken);
}

function getNextAttribute(source, options, attrs, deliverPToken) {
   source.extract('word', options.terminators, (sToken) => {
      addAttribute(source, attrs, options, sToken, deliverPToken);
   });
}

function addAttribute(source, attrs, options, name, deliverPToken) {
   if (!name) {
      deliverPToken(attrs);
      return;
   }
   const attr = {
      name,
   };
   attrs.push(attr);

   source.extractToObject('space', attr, 'postNameSpace');
   source.extractToObject('match', '=', attr, 'equal');
   source.extractToObject('space', attr, 'postEqualSpace');
   literal.parse(source, {
      pToken: attr,
      geRef: options.geRef || false,
   }, (gotQuoted) => {
      if (gotQuoted) {
         source.extractToObject('space', attr, 'trailingSpace');
      }

      getNextAttribute(source, options, attrs, deliverPToken);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pAttributes, ec, entityMetaData, preceedingSpace, type, checkName, checkValue) {
   const seenAttrNames = {};

   for (let index = 0; index < pAttributes.length; index++) {
      const attr = pAttributes[index];
      const nameText = misc.textOrBlank(attr.name);

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
         misc.checkWellFormedNameRecommendation(attr.name, ec, entityMetaData, true,
            WARN.ATTRIBUTE_NAME_XMLCOLON_RESERVED,
            WARN.ATTRIBUTE_NAME_XML_RESERVED);
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

               if (valuePart && valuePart.type === text.PTYPE) {
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

function makeTokenCompatible(pAttributes = []) {
   const attrs = [];

   for (let index = 0; index < pAttributes.length; index++) {
      const attr = pAttributes[index];

      attrs.push({
         name: misc.textOrBlank(attr.name),
         value: literal.makeTokenCompatible(attr),
      });
   }

   return attrs;
}

function makeOneTokenCompatible(attributes = []) {
   const attrs = [];

   for (let index = 0; index < attributes.length; index++) {
      const attr = attributes[index];

      attrs.push({
         name: misc.textOrBlank(attr.name),
         value: literal.makeOneTokenCompatible(attr),
      });
   }

   return attrs;
}

function getSTokens(attributes = []) {
   let results = [];

   for (let index = 0; index < attributes.length; index++) {
      const attr = attributes[index];

      results.push(attr.name);
      results.push(attr.postNameSpace);
      results.push(attr.equal);
      results.push(attr.postEqualSpace);

      results = results.concat(literal.getSTokens(attr));

      results.push(attr.trailingSpace);
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
