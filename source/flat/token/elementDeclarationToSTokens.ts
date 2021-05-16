/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ElementDeclarationPToken } from 'pToken';
import { STokenArrayBuilder, SToken } from 'sToken';

import { contentModelToSTokens } from '../common/contentModelToSTokens';
import { unexpandedToSTokens } from '../common/unexpandedToSTokens';

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

   if (token.contentModel) {
      builder.add(contentModelToSTokens(token.contentModel));
   }

   if (token.extra === undefined) {
      if (token.unexpanded) {
         builder.add(unexpandedToSTokens(token.unexpanded));
      }
   } else if (token.extra) {
      builder.add(token.extra);
   }

   builder.add(token.close);

   return builder.sTokenArray;
}

export { elementDeclarationToSTokens };
