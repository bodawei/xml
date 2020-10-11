/* Copyright ® 2018-2019 by 柏大衛. All rights reserved. */

import { STokenArrayBuilder, SToken } from 'sToken';
import { CharRefPToken } from 'token';

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
