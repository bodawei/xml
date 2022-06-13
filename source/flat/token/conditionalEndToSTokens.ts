/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';
import { ConditionalEndPToken } from 'token';
import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

function conditionalEndToSTokens(pToken: ConditionalEndPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open);

   return builder.sTokenArray;
}

export { conditionalEndToSTokens };
