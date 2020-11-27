/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { STokenArrayBuilder, SToken } from 'sToken';
import { ElementDeclarationPToken } from '../../pToken/token/elementDeclaration';

function elementDeclarationToSTokens(token: ElementDeclarationPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(
      token.open,
      token.openSpace,
      token.declType,
      token.declTypeSpace,
      token.name,
      token.nameSpace,
      token.contentSpec,
      token.contentSpecSpace,
   );

   if (token.children) {
      builder.add(...token.children.getSTokenArray());
   }

   if (token.extra) {
      builder.add(token.extra);
   }

   builder.add(token.close);

   return builder.sTokenArray;
}

export { elementDeclarationToSTokens };
