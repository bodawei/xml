/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { STokenSource, SToken } from 'basic';

const ELEMENT_END_PTOKEN = 'ELEMENT_END_PTOKEN';

type PreToken = { open: SToken; [other: string]: any };

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

function parseElementEnd(
   source: STokenSource,
   open: SToken,
   deliverPToken: (result: ElementEndPToken) => void,
) {
   const pToken: PreToken = {
      open,
   };

   source.extractToObject('space', pToken, 'openSpace');
   source.extractToObject('word', ['>'], pToken, 'name');
   source.extractToObject('space', pToken, 'nameSpace');

   source.extract('match', '>', (sToken) => {
      pToken.close = sToken;
      deliverPToken(new ElementEndPToken(pToken));
   });
}

export { ELEMENT_END_PTOKEN, ElementEndPToken, parseElementEnd };
