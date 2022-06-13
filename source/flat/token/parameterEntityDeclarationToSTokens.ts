/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ParameterEntityDeclarationPToken } from 'pToken';
import { SToken } from 'basic';
import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

import { externalIdToSTokens } from '../common/externalIdToSTokens';
import { unexpandedToSTokens } from '../common/unexpandedToSTokens';
import { literalToSTokens } from '../common/literalToSTokens';

function parameterEntityDeclarationToSTokens(
   pToken: ParameterEntityDeclarationPToken,
): Array<SToken> {
   const builder = new STokenArrayBuilder();
   const literalSTokens = literalToSTokens(pToken);
   const externalIdSTokens = externalIdToSTokens(pToken.externalId);

   builder.add(
      pToken.open,
      pToken.openSpace,
      pToken.declType,
      pToken.declTypeSpace,
      pToken.parameter,
      pToken.parameterSpace,
      pToken.name,
      pToken.nameSpace,
      externalIdSTokens,
      pToken.externalIdSpace,
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

export { parameterEntityDeclarationToSTokens };
