/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';
import { NotationDeclarationPToken } from 'pToken';

import { externalIdToSTokens } from '../common/externalIdToSTokens';
import { unexpandedToSTokens } from '../common/unexpandedToSTokens';
import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

function notationDeclarationToSTokens(pToken: NotationDeclarationPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

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

   if (pToken.extra === undefined) {
      builder.add(unexpandedToSTokens(pToken.unexpanded));
   } else if (pToken.extra) {
      builder.add(pToken.extra);
   }

   builder.add(pToken.close);

   return builder.sTokenArray;
}

export { notationDeclarationToSTokens };
