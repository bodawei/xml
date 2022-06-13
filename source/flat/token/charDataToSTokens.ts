/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';
import { CharDataPToken } from 'token';
import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

function charDataToSTokens(pToken: CharDataPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.text);

   return builder.sTokenArray;
}

export { charDataToSTokens };
