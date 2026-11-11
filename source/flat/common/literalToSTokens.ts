/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';
import { LiteralPToken } from 'token';

import { STokenArrayBuilder } from '../util/STokenArrayBuilder';
import { literalValueToSTokens } from './literalValueToSTokens';

function literalToSTokens(pToken: LiteralPToken | undefined): Array<SToken> {
   const builder = new STokenArrayBuilder();

   if (!pToken) {
      return builder.sTokenArray;
   }

   builder.add(pToken.openQuote, literalValueToSTokens(pToken.value), pToken.closeQuote);

   return builder.sTokenArray;
}

export { literalToSTokens };
