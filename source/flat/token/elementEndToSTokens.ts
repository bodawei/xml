/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { SToken, STokenArrayBuilder } from 'sToken';
import { ElementEndPToken } from 'token';

function elementEndToSTokens(pToken: ElementEndPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open, pToken.openSpace, pToken.name, pToken.nameSpace, pToken.close);

   return builder.sTokenArray;
}

export { elementEndToSTokens };
