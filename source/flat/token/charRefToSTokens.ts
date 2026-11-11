/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';
import { CharRefPToken } from 'pToken';

import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

function charRefToSTokens(pToken: CharRefPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(
      pToken.open,
      pToken.openSpace,
      pToken.hexMarker,
      pToken.hexMarkerSpace,
      pToken.digits,
      pToken.digitsSpace,
      pToken.close,
   );

   return builder.sTokenArray;
}

export { charRefToSTokens };
