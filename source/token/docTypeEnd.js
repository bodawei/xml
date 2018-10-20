/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import base from './base';

/**********************************************************************\
 docTypeEnd is the portion of a DOCTYPE declaration that comes after
 the internal subset (whether or not it is present).

 See docTypeStart for more details
\**********************************************************************/

const WFEID = WellFormedError.ID;
const DOCTYPE_END = 'DOCTYPE_END';
const DOCTYPE_END_XTOKEN = 'DOCTYPE_END_XTOKEN';

class DocTypeEnd extends base.XToken {
   constructor() {
      super(DOCTYPE_END_XTOKEN, {});
   }
}

class DocTypeEndPToken extends base.PToken {
   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(props) {
      super(DOCTYPE_END, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(this.closeInternalSubset,
         this.postCloseInternalSubsetSpace,
         this.close);

      return results;
   }
}

/**********************************************************************\
 parse() extracts ]> from the end of a DOCTYPE statement.

 This assumes that the next character in the source is a ].

 PARAM
 source: A STokenSource to read from
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   [28] doctypedecl ::= '<!DOCTYPE' S Name (S ExternalID)? S?
      ('[' intSubset ']' S?)? '>'
\**********************************************************************/

function parse(source, deliverPToken) {
   const pToken = {
      type: DOCTYPE_END,
   };

   source.extractToObject('match', ']', pToken, 'closeInternalSubset');
   source.extractToObject('space', pToken, 'postCloseInternalSubsetSpace');

   source.extract('match', '>', (sToken) => {
      pToken.close = sToken;
      deliverPToken(pToken);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

// eslint-disable-next-line no-unused-vars
function checkWellFormed(pToken, docTypeStartPToken, ec, emd) {
   ec.setPos(pToken.closeInternalSubset);

   if (!docTypeStartPToken || !docTypeStartPToken.startInternalSubset) {
      ec.check(pToken.closeInternalSubset, WFEID.DOCTYPE_INVALID_SUBSET_CLOSE);
   }

   // If there is no close, and no closeInternalSubset, this won't get a very good position.
   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.DOCTYPE_NO_CLOSE);

   return ec;
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken) {
   return new DocTypeEnd(pToken);
}

export {
   DOCTYPE_END as PTYPE,
   DOCTYPE_END_XTOKEN as XTYPE,
   DocTypeEnd as XToken,
   DocTypeEndPToken as PToken,
   parse,
   checkWellFormed,
   pTokenToXToken,

   DocTypeEndPToken,
};
