/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { AttListDeclarationPToken } from 'pToken';
import { STokenArrayBuilder, SToken } from 'sToken';

// ick
import literal from '../../token/common/literal';

function attListDeclarationToSTokens(token: AttListDeclarationPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(
      token.open,
      token.openSpace,
      token.declType,
      token.declTypeSpace,
      token.elementName,
      token.elementNameSpace,
   );

   for (const def of token.attDefs) {
      const literalSTokens = literal.getSTokens(def);

      builder.add(
         def.name,
         def.nameSpace,
         def.type,
         def.typeSpace,
         def.defaultType,
         def.defaultTypeSpace,
         ...(def.enumeration ? def.enumeration.toSTokenArray() : []),
      );

      builder.add(literalSTokens, def.valueSpace);
   }

   if (token.extra) {
      builder.add(token.extra);
   }

   builder.add(token.close);

   return builder.sTokenArray;
}

export { attListDeclarationToSTokens };
