/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';
import { AttListDeclarationPToken } from 'pToken';

import { literalToSTokens } from '../common/literalToSTokens';
import { unexpandedToSTokens } from '../common/unexpandedToSTokens';
import { wordListToSTokens } from '../common/wordListToSTokens';
import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

function attListDeclarationToSTokens(pToken: AttListDeclarationPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(
      pToken.open,
      pToken.openSpace,
      pToken.declType,
      pToken.declTypeSpace,
      pToken.elementName,
      pToken.elementNameSpace,
   );

   for (const def of pToken.attDefs) {
      const literalSTokens = literalToSTokens(def);

      builder.add(
         def.name,
         def.nameSpace,
         def.type,
         def.typeSpace,
         def.enumeration ? wordListToSTokens(def.enumeration) : [],
         def.defaultType,
         def.defaultTypeSpace,
         literalSTokens,
         def.valueSpace,
      );
   }

   if (pToken.extra === undefined) {
      if (pToken.unexpanded) {
         builder.add(unexpandedToSTokens(pToken.unexpanded));
      }
   } else if (pToken.extra) {
      builder.add(pToken.extra);
   }

   builder.add(pToken.close);

   return builder.sTokenArray;
}

export { attListDeclarationToSTokens };
