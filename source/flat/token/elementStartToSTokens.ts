/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { SToken } from 'sToken';
import { ElementEmptyPToken, ElementStartPToken } from 'token';
import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

import { attributeToSTokens } from '../common/attributeToSTokens';

function elementStartToSTokens(pToken: ElementStartPToken | ElementEmptyPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();
   const sTokens = attributeToSTokens(pToken.attributes);

   builder.add(pToken.open, pToken.openSpace, pToken.name, pToken.nameSpace, sTokens, pToken.close);

   return builder.sTokenArray;
}

export { elementStartToSTokens };
