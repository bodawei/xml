/* Copyright ® 2016-2019 by 柏大衛. All rights reserved. */

import { STokenSource, SToken } from 'sToken';

import { DocTypeStartPToken } from './docTypeStart';

/**********************************************************************\
 docTypeEnd is the portion of a DOCTYPE declaration that comes after
 the internal subset (whether or not it is present).

 See docTypeStart for more details
\**********************************************************************/

const DOCTYPE_END_PTOKEN = 'DOCTYPE_END_PTOKEN';

type PreToken = { docTypeStartPToken: DocTypeStartPToken; [ other: string ]: any };

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

export {
   DOCTYPE_END_PTOKEN,

   DocTypeEndPToken,

   parseDocTypeEnd,
};
