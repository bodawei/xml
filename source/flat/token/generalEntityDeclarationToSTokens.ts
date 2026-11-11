/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';
import { GeneralEntityDeclarationPToken } from 'pToken';

import { externalIdToSTokens } from '../common/externalIdToSTokens';
import { literalToSTokens } from '../common/literalToSTokens';
import { unexpandedToSTokens } from '../common/unexpandedToSTokens';
import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

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
