/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';
import { TextDeclarationPToken } from 'pToken';

import { fieldedInstructionToSTokens } from '../common/fieldedInstructionToSTokens';

function textDeclarationToSTokens(pToken: TextDeclarationPToken): Array<SToken> {
   return fieldedInstructionToSTokens(pToken);
}

export { textDeclarationToSTokens };
