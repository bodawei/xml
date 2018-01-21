/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import externalId from './common/externalId.js';
import * as declaration from './bridge/declaration.js';
import misc from './common/misc.js';
import * as base from './base.js';

const WFEID = WellFormedError.ID;
const DOCTYPE_START = 'DOCTYPE_START';

/**********************************************************************\
 The docTypeStart namespace contains the Token class, parser, validator
 and tokenizer for the start of a DOCTYPE token.

 The overall architecture of the system is that because the DOCTYPE
 declaration could be megabytes long (if there is a big internal
 subset) it makes some sense to treat the start of the DOCTYPE as one
 token and the end as a separate. This also makes "streaming" the
 internal subset easier since this does not need to worry about
 whether the end of the declaration is sound before the start of the
 internal subset can be delivered.

 Because of this, the items in this namespace merely process up to the
 "[" that opens the internal subset, or at least up to where that would
 be in the case that there is no internal subset.
\**********************************************************************/

class DocTypeStart extends base.XToken {

   constructor(name, externalLocation, hasInternalSubset, sTokens) {
      super(sTokens);

      this.name = name;
      this.externalLoc = externalLocation;
      this.hasInternalSubset = hasInternalSubset;
   }

}

class DocTypeStartPToken extends declaration.PToken {
   constructor(props) {
      /* istanbul ignore next */ // Istanbul is confused by transpilation
      super(DOCTYPE_START, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(this.name,
         this.postNameSpace);
      results.pushSTokens.apply(results, externalId.getSTokens(this.externalId)); // eslint-disable-line prefer-spread
      results.pushSTokens(this.postExternalIdSpace,
         this.postPublicSpace,
         this.startInternalSubset);

      return results;
   }
}

/**********************************************************************\
 parse() extracts the pieces of a doctypedecl up to the start of
 an internal subset start.

 This assumes that the "<!DOCTYPE S" has already been processed,
 and those STokens are passed in through declarationStart.

 PARAM
 source: A STokenSource to read from
 declarationPToken: A declaration PToken
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   [28] doctypedecl ::= '<!DOCTYPE' S Name (S ExternalID)? S?
      ('[' intSubset ']' S?)? '>'
\**********************************************************************/

function parse(source, declarationPToken, deliverPToken) {
   const pToken = new DocTypeStartPToken(declarationPToken);

   source.extractToObject('word', [ '[', '>' ], pToken, 'name'); // look for quotes?
   source.extractToObject('space', undefined, pToken, 'postNameSpace');

   externalId.parse(source, [ '[', '>' ], (externalId) => {
      pToken.externalId = externalId;

      source.extractToObject('space', undefined, pToken, 'postExternalIdSpace');

      source.extract('match', '[', (sToken) => {
         pToken.startInternalSubset = sToken;
         deliverPToken(pToken);
      });
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken, ec, entityMetaData) {
   declaration.checkWellFormed(pToken, ec, entityMetaData);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.DOCTYPE_NO_NAME);
   misc.checkName(pToken.name, ec, entityMetaData, WFEID.DOCTYPE_NAME_INVALID);

   externalId.checkWellFormed(pToken.externalId, ec, entityMetaData);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken) {
   return new DocTypeStart(misc.textOrBlank(pToken.name),
      externalId.makeEntityLocation(pToken.externalId),
      !!pToken.startInternalSubset,
      pToken);
}

export {
   DOCTYPE_START as PTYPE,
   DocTypeStart as XToken,
   DocTypeStartPToken as PToken,
   parse,
   checkWellFormed,
   pTokenToXToken,
};
