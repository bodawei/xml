/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ContentModelP, isContentModelP } from 'pToken';
import { SToken, STokenArrayBuilder } from 'sToken';

function contentModelToSTokens(contentSpec: ContentModelP): Array<SToken> {
   const builder = new STokenArrayBuilder();
   const particles = contentSpec.particles || [];

   builder.add(contentSpec.open, contentSpec.openSpace);

   for (const cp of particles) {
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
