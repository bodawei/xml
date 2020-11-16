/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ParameterEntityDeclarationPToken } from 'pToken';
import { SToken, STokenArrayBuilder } from 'sToken';

import { externalIdToSTokens } from '../common/externalIdToSTokens';
import { unexpandedToSTokens } from '../common/unexpandedToSTokens';

// ick
import literal from '../../token/common/literal';

function parameterEntityDeclarationToSTokens(
   pToken: ParameterEntityDeclarationPToken,
): Array<SToken> {
   const builder = new STokenArrayBuilder();
   const literalSTokens = literal.getSTokens(pToken);
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

   if (pToken.extra) {
      builder.add(pToken.extra);
   } else if (pToken.extra !== false) {
      builder.add(...unexpandedToSTokens(pToken.unexpanded));
   }

   builder.add(pToken.close);

   return builder.sTokenArray;
}

export { parameterEntityDeclarationToSTokens };
