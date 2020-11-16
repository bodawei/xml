/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { NotationDeclarationPToken } from 'pToken';
import { STokenArrayBuilder, SToken } from 'sToken';

import { externalIdToSTokens } from '../common/externalIdToSTokens';
import { unexpandedToSTokens } from '../common/unexpandedToSTokens';

function notationDeclarationToSTokens(pToken: NotationDeclarationPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();
   const unexpanded = unexpandedToSTokens(pToken.unexpanded);

   builder.add(
      pToken.open,
      pToken.openSpace,
      pToken.declType,
      pToken.declTypeSpace,
      pToken.name,
      pToken.nameSpace,
      externalIdToSTokens(pToken.externalId),
      pToken.externalIdSpace,
   );

   if (pToken.extra) {
      builder.add(pToken.extra);
   } else if (pToken.extra !== false) {
      builder.add(...unexpanded);
   }

   builder.add(pToken.close);

   return builder.sTokenArray;
}

export { notationDeclarationToSTokens };
