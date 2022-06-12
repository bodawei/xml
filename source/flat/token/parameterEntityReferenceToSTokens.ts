/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { ParameterEntityReferencePToken } from 'pToken';
import { SToken } from 'sToken';
import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

function parameterEntityReferenceToSTokens(pToken: ParameterEntityReferencePToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open, pToken.openSpace, pToken.name, pToken.nameSpace, pToken.close);

   return builder.sTokenArray;
}

export { parameterEntityReferenceToSTokens };
