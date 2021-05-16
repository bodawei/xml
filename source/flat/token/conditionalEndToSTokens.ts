/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { SToken, STokenArrayBuilder } from 'sToken';
import { ConditionalClosePToken } from 'token';

function conditionalEndToSTokens(pToken: ConditionalClosePToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open);

   return builder.sTokenArray;
}

export { conditionalEndToSTokens };
