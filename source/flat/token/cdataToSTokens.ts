/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';
import { CdataPToken } from 'token';
import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

function cdataToSTokens(pToken: CdataPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(
      pToken.open,
      pToken.openSpace,
      pToken.sectionType,
      pToken.sectionTypeSpace,
      pToken.bracket,
      pToken.text,
      pToken.close,
   );

   return builder.sTokenArray;
}

export { cdataToSTokens };
