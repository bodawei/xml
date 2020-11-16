/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { SToken, STokenArrayBuilder } from 'sToken';
import { ExternalIdP } from 'pToken';
// ick
import literal from '../../token/common/literal';

function externalIdToSTokens(externalId: ExternalIdP | undefined): Array<SToken> {
   if (!externalId) {
      return [];
   }

   const builder = new STokenArrayBuilder();
   const publicPart = literal.getSTokens(externalId.public);
   const systemPart = literal.getSTokens(externalId.system);

   builder.add(
      externalId.externalType,
      externalId?.externalTypeSpace,
      ...publicPart,
      externalId.publicSpace,
      ...systemPart,
   );

   return builder.sTokenArray;
}

export { externalIdToSTokens };
