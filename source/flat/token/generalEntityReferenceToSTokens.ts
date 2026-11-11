/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';
import { GeneralEntityReferencePToken } from 'pToken';

import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

function generalEntityReferenceToSTokens(pToken: GeneralEntityReferencePToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open, pToken.openSpace, pToken.name, pToken.nameSpace, pToken.close);

   return builder.sTokenArray;
}

export { generalEntityReferenceToSTokens };
