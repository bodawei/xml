/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { WellFormedError, XmlWarning } from '../error';

import misc from './common/misc.js';
import * as base from './base.js';

const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;
const ELEMENT_END = 'ELEMENT_END';

/**********************************************************************\
 The elementStart namespace contains the usual tools for processing
 an element start tag.
\**********************************************************************/

class ElementEnd extends base.XToken {

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(name, pToken) {
      super(pToken);

      this.name = name;
   }

}

class ElementEndPToken extends base.PToken {
   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(props) {
      super(ELEMENT_END, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(this.open,
         this.postOpenSpace,
         this.name,
         this.postNameSpace,
         this.close);

      return results;
   }
}

/**********************************************************************\
 parse() extracts the pieces of an element end tag.

 This assumes that the "</" has already been processed and has been
 passed as an argument to this

 PARAM
 source: A STokenSource to read from
 open: the SToken corresponding to the opening </
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   [42] ETag ::= '</' Name S? '>'
\**********************************************************************/

function parse(source, open, deliverPToken) {
   const pToken = new ElementEndPToken({
      open,
   });

   source.extractToObject('space', pToken, 'postOpenSpace');
   source.extractToObject('word', [ '>' ], pToken, 'name');
   source.extractToObject('space', pToken, 'postNameSpace');

   source.extract('match', '>', (sToken) => {
      pToken.close = sToken;
      deliverPToken(pToken);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken, ec, entityMetaData) {
   ec.setPos(pToken.postOpenSpace);
   ec.check(pToken.postOpenSpace, WFEID.ELEMENT_XTRA_LEADING_SPACE);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.ELEMENT_NO_NAME);
   misc.checkName(pToken.name, ec, entityMetaData, WFEID.ELEMENT_NAME_INVALID);
   misc.checkWellFormedNameRecommendation(pToken.name, ec, entityMetaData,
      WARN.ELEMENT_NAME_XMLDASH_RESERVED,
      WARN.ELEMENT_NAME_XML_RESERVED);

   ec.setPos(pToken.postNameSpace);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.ELEMENT_NO_CLOSE);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken) {
   return new ElementEnd(misc.textOrBlank(pToken.name), pToken);
}

export {
   ELEMENT_END as PTYPE,
   ElementEnd as XToken,
   ElementEndPToken as PToken,
   parse,
   checkWellFormed,
   pTokenToXToken,
};
