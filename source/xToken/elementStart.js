/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { WellFormedError, XmlWarning } from '../error';

import {
   pushNonBottom,
   textOrBlank,
} from './common/util.js';
import * as attribute from './common/attribute.js';
import * as misc from './common/misc.js';
import { Token as XmlToken } from './xmlToken.js';

const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;
const ELEMENT_START = 'ELEMENT_START';

/**********************************************************************\
 The elementStart namespace contains the usual tools for processing
 an element start tag.
\**********************************************************************/

class ElementStart extends XmlToken {

   constructor(name, attributes, lTokens) {
      super(lTokens);

      this.name = name;
      this.attributes = attributes;
   }

}

/**********************************************************************\
 parse() extracts the pieces of an element start tag.

 This assumes that the "<" has already been parsed and has been passed
 as an argument to this

 PARAM
 source: A LTokenSource to read from
 open: the LToken corresponding to the opening <
 deliverParsed: Callback to deliver the parsed LTokens

 SYNTAX
   [40] STag ::= '<' Name (S Attribute)* S? '>'
   [42] ETag ::= '</' Name S? '>'
   [44] EmptyElemTag ::= '<' Name (S Attribute)* S? '/>'
\**********************************************************************/

function parse(source, open, deliverParsed) {
   const parsed = {
      type: ELEMENT_START,
      open,
   };

   source.extractToObject('space', parsed, 'postOpenSpace');
   source.extractToObject('word', [ '>' ], parsed, 'name');
   source.extractToObject('space', parsed, 'postNameSpace');

   attribute.parse(source, { terminators: [ '>' ]}, (attributes) => {
      parsed.attributes = attributes;

      source.extract('match', '>', (lToken) => {
         parsed.close = lToken;
         deliverParsed(parsed);
      });
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(parsed, ec, entityMetaData) {
   ec.setPos(parsed.postOpenSpace);
   ec.check(parsed.postOpenSpace, WFEID.ELEMENT_XTRA_LEADING_SPACE);

   ec.setPos(parsed.name);
   ec.check(!parsed.name, WFEID.ELEMENT_NO_NAME);
   misc.checkName(parsed.name, ec, entityMetaData, WFEID.ELEMENT_NAME_INVALID);
   misc.checkWellFormedNameRecommendation(parsed.name, ec, entityMetaData,
      WARN.ELEMENT_NAME_XMLDASH_RESERVED,
      WARN.ELEMENT_NAME_XML_RESERVED);

   ec.setPos(parsed.postNameSpace);

   const attribs = parsed.attributes || [];
   attribute.checkWellFormed(attribs, ec, entityMetaData, parsed.postNameSpace, WFEID.NOUN_ATTRIBUTE);

   ec.setPos(parsed.close);
   ec.check(!parsed.close, WFEID.ELEMENT_NO_CLOSE);
}

/**********************************************************************\
 makeToken() converts a parsed into a token.
\**********************************************************************/

function makeToken(parsed) {
   return new ElementStart(textOrBlank(parsed.name),
      attribute.makeTokenCompatible(parsed.attributes), getLTokens(parsed));
}

function getLTokens(parsed) {
   const results = [];

   pushNonBottom(results, parsed.open);
   pushNonBottom(results, parsed.postOpenSpace);
   pushNonBottom(results, parsed.name);
   pushNonBottom(results, parsed.postNameSpace);
   attribute.appendLTokens(results, parsed.attributes);
   pushNonBottom(results, parsed.close);

   return results;
}

export {
   ELEMENT_START as TYPE,
   ElementStart as Token,
   parse,
   checkWellFormed,
   makeToken,
};
