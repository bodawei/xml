/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { TextPToken } from 'pToken';
import { SToken } from 'sToken';

function textToSTokens(pToken: TextPToken): Array<SToken> {
   return pToken.text ? [pToken.text] : [];
}

export { textToSTokens };
