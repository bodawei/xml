/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import {
   textOrBlank,
} from './common/misc.js';
import misc from './common/misc.js';
import * as base from './base.js';

const CHARDATA = 'CHARDATA';

/**********************************************************************\
 The charData namespace contains the usual tools for processing
 a run of CharData
\**********************************************************************/

class CharData extends base.XToken {

   constructor(text, sTokens) {
      super(sTokens);

      this.text = text;
   }

}

class CharDataPToken extends base.PToken {
   constructor(props) {
      super(CHARDATA, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(this.text);

      return results;
   }
}

/**********************************************************************\
 parse() extracts a series of char data.

 PARAM
 source: A STokenSource to read from
 otherTerminators: (optional) An array of strings that can serve
   as terminators for the character data
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   [14] CharData ::= [^<&]* - ([^<&]* ']]>' [^<&]*)
\**********************************************************************/

function parse(source, otherTerminators, deliverPToken) {
   let terminators = [ '<', '&', ']]>' ];
   if (typeof otherTerminators === 'function') {
      deliverPToken = otherTerminators;
   } else {
      terminators = terminators.concat(otherTerminators);
   }

   const pToken = new CharDataPToken();

   source.extract('all', terminators, (sToken) => {
      pToken.text = sToken;
      deliverPToken(pToken);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken, ec, entityMetaData) {
   ec.setPos(pToken.text);
   misc.checkWellFormedText(pToken.text, ec, entityMetaData);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken) {
   return new CharData(textOrBlank(pToken.text), pToken);
}

export {
   CHARDATA as PTYPE,
   CharData as XToken,
   CharDataPToken as PToken,
   parse,
   checkWellFormed,
   pTokenToXToken,
};
