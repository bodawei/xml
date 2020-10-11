/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { SToken } from 'sToken';
import { XmlDeclarationPToken } from 'pToken';

import { fieldedInstructionToSTokens } from '../common/fieldedInstructionToSTokens';

function xmlDeclarationToSTokens(pToken: XmlDeclarationPToken): Array<SToken> {
   return fieldedInstructionToSTokens(pToken);
}

export { xmlDeclarationToSTokens };
