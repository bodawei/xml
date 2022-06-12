/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { SToken } from 'sToken';
import { DocTypeStartPToken } from 'token';
import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

import { externalIdToSTokens } from '../common/externalIdToSTokens';

function docTypeStartToSTokens(pToken: DocTypeStartPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();
   const externalTokens = externalIdToSTokens(pToken.externalId);

   builder.add(
      pToken.open,
      pToken.postOpenSpace,
      pToken.declType,
      pToken.postDeclTypeSpace,
      pToken.name,
      pToken.nameSpace,
      externalTokens,
      pToken.externalIdSpace,
      pToken.openSubset,
   );

   return builder.sTokenArray;
}

export { docTypeStartToSTokens };
