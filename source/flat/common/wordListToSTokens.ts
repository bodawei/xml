/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { SToken, STokenArrayBuilder } from 'sToken';
import { WordListPToken } from 'token';

function wordListToSTokens(pToken: WordListPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open, pToken.openSpace);

   for (const entry of pToken.words) {
      builder.add(entry.word, entry.wordSpace, entry.connector, entry.connectorSpace);
   }

   builder.add(pToken.close, pToken.closeSpace);

   return builder.sTokenArray;
}

export { wordListToSTokens };
