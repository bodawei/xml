/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { SToken } from 'sToken';
import { ExternalIdP } from 'pToken';
import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

import { literalToSTokens } from './literalToSTokens';

function externalIdToSTokens(externalId: ExternalIdP | undefined): Array<SToken> {
   if (!externalId) {
      return [];
   }

   const builder = new STokenArrayBuilder();

   builder.add(
      externalId.externalType,
      externalId.externalTypeSpace,
      literalToSTokens(externalId.public),
      externalId.publicSpace,
      literalToSTokens(externalId.system),
   );

   return builder.sTokenArray;
}

export { externalIdToSTokens };
