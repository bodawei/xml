/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { GeneralEntityDeclarationPToken } from 'pToken';
import { SToken, STokenArrayBuilder } from 'sToken';

import { externalIdToSTokens } from '../common/externalIdToSTokens';
import { unexpandedToSTokens } from '../common/unexpandedToSTokens';
import { literalToSTokens } from '../common/literalToSTokens';

function generalEntityDeclarationToSTokens(pToken: GeneralEntityDeclarationPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();
   const literalSTokens = literalToSTokens(pToken);
   const externalIdSTokens = externalIdToSTokens(pToken.externalId);

   builder.add(
      pToken.open,
      pToken.openSpace,
      pToken.declType,
      pToken.declTypeSpace,
      pToken.name,
      pToken.nameSpace,
      externalIdSTokens,
      pToken.externalIdSpace,
      pToken.nData,
      pToken.nDataSpace,
      pToken.nDataName,
      pToken.nDataNameSpace,
      literalSTokens,
      pToken.valueSpace,
   );

   if (pToken.extra === undefined) {
      builder.add(unexpandedToSTokens(pToken.unexpanded));
   } else if (pToken.extra) {
      builder.add(pToken.extra);
   }

   builder.add(pToken.close);

   return builder.sTokenArray;
}

export { generalEntityDeclarationToSTokens };
