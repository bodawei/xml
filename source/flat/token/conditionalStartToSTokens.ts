/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { SToken, STokenArrayBuilder } from 'sToken';
import { ConditionalStartPToken } from 'token';
import { parameterEntityReferenceToSTokens } from './parameterEntityReferenceToSTokens';

function conditionalStartToSTokens(pToken: ConditionalStartPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open, pToken.openSpace, pToken.sectionType);

   if (pToken.unexpanded && !pToken.bracket) {
      builder.add(parameterEntityReferenceToSTokens(pToken.unexpanded.peRef));
   } else {
      builder.add(pToken.sectionTypeSpace, pToken.bracket);
   }

   return builder.sTokenArray;
}

export { conditionalStartToSTokens };
