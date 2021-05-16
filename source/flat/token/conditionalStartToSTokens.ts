/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { SToken, STokenArrayBuilder } from 'sToken';
import { ConditionalPToken } from 'token';
import { parameterEntityReferenceToSTokens } from './parameterEntityReferenceToSTokens';

function conditionalStartToSTokens(pToken: ConditionalPToken): Array<SToken> {
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
