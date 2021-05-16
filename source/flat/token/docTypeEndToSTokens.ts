/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { STokenArrayBuilder, SToken } from 'sToken';

import { DocTypeEndPToken } from 'token';

function docTypeEndToSTokens(pToken: DocTypeEndPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.closeSubset, pToken.closeSubsetSpace, pToken.close);

   return builder.sTokenArray;
}

export { docTypeEndToSTokens };
