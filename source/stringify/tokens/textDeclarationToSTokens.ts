/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { SToken } from 'sToken';
import { TextDeclarationPToken } from 'pToken';

import { sTokensFromPToken } from '../../token/common/entityInstruction';

function textDeclarationToSTokens(pToken: TextDeclarationPToken): Array<SToken> {
   return sTokensFromPToken(pToken);
}

export { textDeclarationToSTokens };
