/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { SToken } from 'sToken';
import { XmlDeclarationPToken } from 'pToken';

import { sTokensFromPToken } from '../../token/common/entityInstruction';


function xmlDeclarationToSTokens(pToken: XmlDeclarationPToken): Array<SToken> {
   return sTokensFromPToken(pToken);
}

export { xmlDeclarationToSTokens };
