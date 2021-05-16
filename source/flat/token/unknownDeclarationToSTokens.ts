/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { SToken, STokenArrayBuilder } from 'sToken';
import { DeclarationPToken } from 'token';

function unknownDeclarationToSTokens(pToken: DeclarationPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.open, pToken.postOpenSpace, pToken.declType, pToken.postDeclTypeSpace);

   return builder.sTokenArray;
}

export { unknownDeclarationToSTokens };
