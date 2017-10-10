/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import {
   pushNonBottom,
   textOrBlank,
} from './common/util.js';
import * as misc from './common/misc.js';
import { Token as XmlToken } from './xmlToken.js';

const CHARDATA = 'CHARDATA';

/**********************************************************************\
 The charData namespace contains the usual tools for processing
 a run of CharData
\**********************************************************************/

class CharData extends XmlToken {

   constructor(text, lTokens) {
      super(lTokens);

      this.text = text;
   }

}

/**********************************************************************\
 parse() extracts a series of char data.

 PARAM
 source: A LTokenSource to read from
 otherTerminators: (optional) An array of strings that can serve
   as terminators for the character data
 deliverParsed: Callback to deliver the parsed LTokens

 SYNTAX
   [14] CharData ::= [^<&]* - ([^<&]* ']]>' [^<&]*)
\**********************************************************************/

function parse(source, otherTerminators, deliverParsed) {
   let terminators = [ '<', '&', ']]>' ];
   if (typeof otherTerminators === 'function') {
      deliverParsed = otherTerminators;
   } else {
      terminators = terminators.concat(otherTerminators);
   }

   const parsed = {
      type: CHARDATA,
   };

   source.extract('all', terminators, (lToken) => {
      parsed.text = lToken;
      deliverParsed(parsed);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(parsed, ec, entityMetaData) {
   ec.setPos(parsed.text);
   misc.checkWellFormedText(parsed.text, ec, entityMetaData);
}

/**********************************************************************\
 makeToken() converts a parsed into a token.
\**********************************************************************/

function makeToken(parsed) {
   return new CharData(textOrBlank(parsed.text), getLTokens(parsed));
}

function getLTokens(parsed) {
   const results = [];

   pushNonBottom(results, parsed.text);

   return results;
}

export {
   CHARDATA as TYPE,
   CharData as Token,
   parse,
   checkWellFormed,
   makeToken,
};
