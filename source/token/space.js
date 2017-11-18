/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import {
   textOrBlank,
} from './common/misc.js';
import * as base from './base.js';

const SPACE = 'SPACE';

/**********************************************************************\
 The comment namespace contains the usual tools for processing XML
 comments
\**********************************************************************/

class Space extends base.XToken {

   constructor(text, pToken) {
      super(pToken);

      this.text = text;
   }

}

class SpacePToken extends base.PToken {
   constructor(props) {
      super(SPACE, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(this.text);

      return results;
   }
}

/**********************************************************************\
 parse() extracts a space.

 PARAM
 source: A STokenSource to read from
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   [15] Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'
\**********************************************************************/

function parse(source, deliverPToken) {
   const pToken = {
      type: SPACE,
   };

   source.extract('space', undefined, (sToken) => {
      pToken.text = sToken;
      deliverPToken(pToken);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken, ec) {
   ec.setPos(pToken.text);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken) {
   return new Space(textOrBlank(pToken.text), pToken);
}

export {
   SPACE as PTYPE,
   Space as XToken,
   SpacePToken as PToken,
   parse,
   checkWellFormed,
   pTokenToXToken,
};
