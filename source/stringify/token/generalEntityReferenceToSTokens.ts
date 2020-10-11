/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { STokenArrayBuilder, SToken } from 'sToken';
import { GeneralEntityReferencePToken } from 'token';

function generalEntityReferenceToSTokens(pToken: GeneralEntityReferencePToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open, pToken.openSpace, pToken.name, pToken.nameSpace, pToken.close);

   return builder.sTokenArray;
}

export { generalEntityReferenceToSTokens };
