/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';
import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

import { DocTypeEndPToken } from 'token';

function docTypeEndToSTokens(pToken: DocTypeEndPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.closeSubset, pToken.closeSubsetSpace, pToken.close);

   return builder.sTokenArray;
}

export { docTypeEndToSTokens };
