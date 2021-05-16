/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { SToken, STokenArrayBuilder } from 'sToken';
import { SpacePToken } from 'token';

function spaceToSTokens(pToken: SpacePToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.text);

   return builder.sTokenArray;
}

export { spaceToSTokens };
