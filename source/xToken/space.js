/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import {
   pushNonBottom,
   textOrBlank,
} from './common/util.js';
import { Token as XmlToken } from './xmlToken.js';

const SPACE = 'SPACE';

/**********************************************************************\
 The comment namespace contains the usual tools for processing XML
 comments
\**********************************************************************/

class Space extends XmlToken {

   constructor(text, lTokens) {
      super(lTokens);

      this.text = text;
   }

}

/**********************************************************************\
 parse() extracts a space.

 PARAM
 source: A LTokenSource to read from
 deliverParsed: Callback to deliver the parsed LTokens

 SYNTAX
   [15] Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'
\**********************************************************************/

function parse(source, deliverParsed) {
   const parsed = {
      type: SPACE,
   };

   source.extract('space', undefined, (lToken) => {
      parsed.text = lToken;
      deliverParsed(parsed);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(parsed, ec) {
   ec.setPos(parsed.text);
}

/**********************************************************************\
 makeToken() converts a parsed into a token.
\**********************************************************************/

function makeToken(parsed) {
   return new Space(textOrBlank(parsed.text), getLTokens(parsed));
}

function getLTokens(parsed) {
   const results = [];

   pushNonBottom(results, parsed.text);

   return results;
}

export {
   SPACE as TYPE,
   Space as Token,
   parse,
   checkWellFormed,
   makeToken,
};
