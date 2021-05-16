/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { TextPToken } from 'pToken';
import { SToken, STokenArrayBuilder } from 'sToken';

function textToSTokens(pToken: TextPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.text);

   return builder.sTokenArray;
}

export { textToSTokens };
