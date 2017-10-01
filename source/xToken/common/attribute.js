/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../../error';

import * as misc from './misc.js';
import * as quotedValue from './quotedValue.js';
import {
   pushNonBottom,
   textOrBlank,
} from './util.js';

/**********************************************************************\
 The attribute namespace contains the usual tools for processing
 attributes, both as found on XML Declarations and start and empty
 element tags.
\**********************************************************************/

const WFEID = WellFormedError.ID;

/**********************************************************************\
 parse() extracts the pieces of an attribute.

 PARAM
 source: A LTokenSource to read from
 options: Optional options that affect parsing. this includes:
   terminators: An array of strings that may be terminators of
   the names of attributes (this is usually [ '>' ])
 deliverParsed: Callback to deliver the parsed LTokens

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

function parse(source, options = {}, deliverResults) {
   const newOptions = {
      terminators: [ '=' ].concat(options.terminators || []),
   };
   getNextAttribute(source, newOptions, [], deliverResults);
}

function getNextAttribute(source, options, attrs, deliverResults) {
   source.extract('word', options.terminators, (lToken) => {
      addAttribute(source, attrs, options, lToken, deliverResults);
   });
}

function addAttribute(source, attrs, options, name, deliverResults) {
   if (!name) {
      deliverResults(attrs);
      return;
   }
   const attr = {
      name,
   };
   attrs.push(attr);

   source.extractToObject('space', attr, 'postNameSpace');
   source.extractToObject('match', '=', attr, 'equal');
   source.extractToObject('space', attr, 'postEqualSpace');
   quotedValue.parse('attr', source, attr, (gotQuoted) => {
      if (gotQuoted) {
         source.extractToObject('space', attr, 'trailingSpace');
      }

      getNextAttribute(source, options, attrs, deliverResults);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(parsed, ec, entityMetaData, preceedingSpace, type, checkName, checkValue) {
   for (let index = 0; index < parsed.length; index++) {
      const attr = parsed[index];
      const nameText = textOrBlank(attr.name);

      if (index === 0) {
         ec.setPos(preceedingSpace);
         ec.check(!preceedingSpace, WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME, [ nameText ]);
      } else {
         ec.setPos(parsed[index - 1].trailingSpace);
         ec.check(!parsed[index - 1].trailingSpace, WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME, [ nameText ]);
      }

      ec.setPos(attr.name);
      misc.checkName(attr.name, ec, entityMetaData, WFEID.ATTRIBUTE_INVALID_NAME);

      if (checkName) {
         checkName(attr.name, index, ec, entityMetaData);
      }

      ec.setPos(attr.postNameSpace);
      ec.setPos(attr.equal);
      ec.check(!attr.equal, WFEID.ATTRIBUTE_NO_EQUAL, [ nameText ]);
      ec.setPos(attr.postEqualSpace);

      quotedValue.checkWellFormed('attr', attr, ec, entityMetaData, type, () => {
         misc.checkWellFormedText(attr.attrValue, ec, entityMetaData);

         if (checkValue) {
            checkValue(attr.name, attr.attrValue, ec, entityMetaData);
         }
      });
   }
}

/**********************************************************************\
 makeTokenCompatible() converts a parsed value into a form that
 can be inserted into a token.
\**********************************************************************/

function makeTokenCompatible(attributes = []) {
   const attrs = [];

   for (let index = 0; index < attributes.length; index++) {
      const attr = attributes[index];

      attrs.push({
         name: textOrBlank(attr.name),
         value: textOrBlank(attr.attrValue),
      });
   }

   return attrs;
}

function appendLTokens(results, attributes = []) {
   for (let index = 0; index < attributes.length; index++) {
      const attr = attributes[index];

      pushNonBottom(results, attr.name);
      pushNonBottom(results, attr.postNameSpace);
      pushNonBottom(results, attr.equal);
      pushNonBottom(results, attr.postEqualSpace);
      quotedValue.appendLTokens('attr', results, attr);
      pushNonBottom(results, attr.trailingSpace);
   }
}

export {
   parse,
   checkWellFormed,
   makeTokenCompatible,
   appendLTokens,
};
