/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { SToken, STokenArrayBuilder } from 'sToken';
import { CommentPToken } from 'token';

function commentToSTokens(pToken: CommentPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open);
   builder.add(...pToken.text);
   builder.add(pToken.close);

   return builder.sTokenArray;
}

export { commentToSTokens };
