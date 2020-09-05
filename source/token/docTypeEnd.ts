/* Copyright ® 2016-2019 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { WellFormedError, ErrorCollector } from 'error';
import { STokenSource, STokenArrayBuilder, SToken } from 'sToken';

import { DocTypeStartPToken } from './docTypeStart';

/**********************************************************************\
 docTypeEnd is the portion of a DOCTYPE declaration that comes after
 the internal subset (whether or not it is present).

 See docTypeStart for more details
\**********************************************************************/

const WFEID = WellFormedError.ID;
const DOCTYPE_END_PTOKEN = 'DOCTYPE_END_PTOKEN';
const DOCTYPE_END_XTOKEN = 'DOCTYPE_END_XTOKEN';

type PreToken = { docTypeStartPToken: DocTypeStartPToken, [ other: string ]: any };

class DocTypeEndPToken {
   public readonly type: typeof DOCTYPE_END_PTOKEN = DOCTYPE_END_PTOKEN;
   public readonly docTypeStartPToken: DocTypeStartPToken;
   public readonly closeSubset?: SToken;
   public readonly closeSubsetSpace?: SToken;
   public readonly close?: SToken;

   constructor(basePToken: DocTypeEndPToken | PreToken) {
      Object.assign(this, basePToken);

      this.docTypeStartPToken = basePToken.docTypeStartPToken; // Make sure type system knows we always assign open
      this.type = DOCTYPE_END_PTOKEN;
   }

   checkWellFormed(ec: ErrorCollector, confVer: ConformanceVersion) {
      return checkWellFormed(this, ec, confVer);
   }

   toXToken() {
      return pTokenToXToken(this);
   }

   toSTokenArray() {
      return sTokensFromPToken(this);
   }
}

class DocTypeEndXToken {
   public readonly type: typeof DOCTYPE_END_XTOKEN = DOCTYPE_END_XTOKEN;
   public pToken?: DocTypeEndPToken;

   constructor(pToken?: DocTypeEndPToken) {
      this.pToken = pToken;
   }
}

/**********************************************************************\
 parseDocTypeEnd() extracts ]> from the end of a DOCTYPE statement.

 This assumes that the next character in the source is a ].

 PARAM
 source: A STokenSource to read from
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   [28] doctypedecl ::= '<!DOCTYPE' S Name (S ExternalID)? S?
      ('[' intSubset ']' S?)? '>'
\**********************************************************************/

function parseDocTypeEnd(source: STokenSource, docTypeStart: DocTypeStartPToken, deliverPToken: (result: DocTypeEndPToken) => void) {
   const pToken: PreToken = {
      docTypeStartPToken: docTypeStart,
   };

   source.extractToObject('match', ']', pToken, 'closeSubset');
   source.extractToObjectNoParams('space', pToken, 'closeSubsetSpace');

   source.extract('match', '>', (sToken) => {
      pToken.close = sToken;
      deliverPToken(new DocTypeEndPToken(pToken));
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken: DocTypeEndPToken, ec: ErrorCollector, confVer: ConformanceVersion) { // eslint-disable-line no-unused-vars
   ec.setPos(pToken.closeSubset);

   if (!pToken.docTypeStartPToken || !pToken.docTypeStartPToken.openSubset) {
      ec.check(pToken.closeSubset, WFEID.DOCTYPE_INVALID_SUBSET_CLOSE);
   }

   // If there is no close, and no closeInternalSubset, this won't get a very good position.
   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.DOCTYPE_NO_CLOSE);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: DocTypeEndPToken) {
   return new DocTypeEndXToken(pToken);
}

/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the component STokens
\**********************************************************************/

function sTokensFromPToken(pToken: DocTypeEndPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(
      pToken.closeSubset,
      pToken.closeSubsetSpace,
      pToken.close);

      return builder.sTokenArray;
}

export {
   DOCTYPE_END_PTOKEN,
   DOCTYPE_END_XTOKEN,

   DocTypeEndPToken,
   DocTypeEndXToken,

   parseDocTypeEnd,
};
