/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { strOrBlank, STokenSource, SToken, STokenArrayBuilder } from 'sToken';

const ELEMENT_END_PTOKEN = 'ELEMENT_END_PTOKEN';
const ELEMENT_END_XTOKEN = 'ELEMENT_END_XTOKEN';

type PreToken = { open: SToken; [ other: string ]: any };

class ElementEndPToken {
   public readonly type: typeof ELEMENT_END_PTOKEN = ELEMENT_END_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly name?: SToken;
   public readonly nameSpace?: SToken;
   public readonly close?: SToken;

   constructor(basePToken: ElementEndPToken | PreToken) {
      Object.assign(this, basePToken);

      this.open = basePToken.open; // Make sure type system knows we always assign open
   }

   toXToken() {
      return pTokenToXToken(this);
   }

   toSTokenArray() {
      return sTokensFromPToken(this);
   }
}

class ElementEndXToken {
   public readonly type: typeof ELEMENT_END_XTOKEN = ELEMENT_END_XTOKEN;
   public readonly name: string;
   public pToken?: ElementEndPToken;

   constructor(name: string, pToken?: ElementEndPToken) {
      this.name = name;
      this.pToken = pToken;
   }

}

/**********************************************************************\
 parseElementEnd() extracts the pieces of an element end tag.

 This assumes that the "</" has already been processed and has been
 passed as an argument to this

 PARAM
 source: A STokenSource to read from
 open: the SToken corresponding to the opening </
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   [42] ETag ::= '</' Name S? '>'
\**********************************************************************/

function parseElementEnd(source: STokenSource, open: SToken, deliverPToken: (result: ElementEndPToken) => void) {
   const pToken: PreToken = {
      open,
   };

   source.extractToObjectNoParams('space', pToken, 'openSpace');
   source.extractToObject('word', [ '>' ], pToken, 'name');
   source.extractToObjectNoParams('space', pToken, 'nameSpace');

   source.extract('match', '>', (sToken) => {
      pToken.close = sToken;
      deliverPToken(new ElementEndPToken(pToken));
   });
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: ElementEndPToken) {
   return new ElementEndXToken(strOrBlank(pToken.name), pToken);
}

/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the component STokens
\**********************************************************************/

function sTokensFromPToken(pToken: ElementEndPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(
      pToken.open,
      pToken.openSpace,
      pToken.name,
      pToken.nameSpace,
      pToken.close);

   return builder.sTokenArray;
}

export {
   ELEMENT_END_PTOKEN,
   ELEMENT_END_XTOKEN,
   ElementEndPToken,
   ElementEndXToken,

   parseElementEnd,
};
