/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { STokenArrayBuilder, SToken } from 'sToken';
import { ParameterEntityReferencePToken } from 'token';

function parameterEntityReferenceToSTokens(pToken: ParameterEntityReferencePToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open, pToken.openSpace, pToken.name, pToken.nameSpace, pToken.close);

   return builder.sTokenArray;
}

export { parameterEntityReferenceToSTokens };
