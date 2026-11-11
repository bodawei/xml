/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';
import { ContentModelP, isContentModelP } from 'pToken';

import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

function contentModelToSTokens(contentSpec: ContentModelP): Array<SToken> {
   const builder = new STokenArrayBuilder();
   const delimitedParticles = contentSpec.delimitedParticles;

   builder.add(contentSpec.open, contentSpec.openSpace);

   for (const cp of delimitedParticles) {
      if (!cp.particle) {
         // do nothing
      } else if (isContentModelP(cp.particle)) {
         builder.add(...contentModelToSTokens(cp.particle));
      } else {
         builder.add(
            cp.particle.name,
            cp.particle.nameSpace,
            cp.particle.repeat,
            cp.particle.repeatSpace,
         );
      }

      builder.add(cp.delimiter, cp.delimiterSpace);
   }

   builder.add(
      contentSpec.close,
      contentSpec.closeSpace,
      contentSpec.repeat,
      contentSpec.repeatSpace,
   );

   return builder.sTokenArray;
}

export { contentModelToSTokens };
