/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { ContentModelP, isContentModelP } from 'pToken';
import { strOrBlank } from 'basic';

enum CpType {
   CHOICE = 'CHOICE',
   SEQUENCE = 'SEQUENCE',
}

enum CpRepeat {
   ONE = 'ONE',
   ZEROONE = 'ZEROONE',
   ONEPLUS = 'ONEPLUS',
   ZEROPLUS = 'ZEROPLUS',
}

interface ContentNameX {
   readonly name: string;
   readonly repeat: CpRepeat;
}

const REPEAT_MAP: Record<string, CpRepeat | undefined> = {
   '*': CpRepeat.ZEROPLUS,
   '+': CpRepeat.ONEPLUS,
   '?': CpRepeat.ZEROONE,
};

class ContentModelX {
   public readonly particles: ReadonlyArray<ContentNameX | ContentModelX>;

   public readonly listType: CpType;

   public readonly repeat: CpRepeat;

   constructor(contentModel: ContentModelP) {
      const repeatStr = strOrBlank(contentModel.repeat);
      let listType: CpType | undefined;
      const protoParticle: Array<ContentNameX | ContentModelX> = [];

      for (const aParticle of contentModel.delimitedParticles) {
         const { particle, delimiter } = aParticle;
         const delimiterStr = strOrBlank(delimiter);

         if (!listType && delimiterStr) {
            listType = delimiterStr === ',' ? CpType.SEQUENCE : CpType.CHOICE;
         }

         if (!particle) {
            continue;
         }

         if (isContentModelP(particle)) {
            protoParticle.push(new ContentModelX(particle));
         } else {
            protoParticle.push({
               name: strOrBlank(particle.name),
               repeat: REPEAT_MAP[strOrBlank(particle.repeat)] ?? CpRepeat.ONE,
            });
         }
      }

      this.listType = listType ?? CpType.CHOICE;
      this.repeat = REPEAT_MAP[repeatStr] ?? CpRepeat.ONE;
      this.particles = protoParticle;
   }
}

function isContentNameX(item: ContentModelX | ContentNameX): item is ContentNameX {
   return 'name' in item && !('particles' in item) && !('listType' in item);
}

function cloneParticlesArray(
   source: ReadonlyArray<ContentNameX | ContentModelX>,
): ReadonlyArray<ContentNameX | ContentModelX> {
   const particles: Array<ContentNameX | ContentModelX> = [];

   for (const particle of source) {
      if (isContentNameX(particle)) {
         particles.push({
            ...particle,
         });
      } else {
         particles.push({
            ...particle,
            particles: cloneParticlesArray(particle.particles),
         });
      }
   }

   return particles;
}
function cloneContentModelX(source: ContentModelX | undefined): ContentModelX | undefined {
   if (!source) {
      return source;
   }

   return {
      ...source,
      particles: cloneParticlesArray(source.particles),
   };
}

export { ContentModelX, ContentNameX, CpRepeat, CpType, isContentNameX, cloneContentModelX };
