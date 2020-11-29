import { ContentModelP, isContentModelP } from 'pToken';
import { strOrBlank } from 'sToken';

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

const REPEAT_MAP: { [key: string]: CpRepeat } = {
   '*': CpRepeat.ZEROPLUS,
   '+': CpRepeat.ONEPLUS,
   '?': CpRepeat.ZEROONE,
};

class ContentModelX {
   public readonly particles: Array<ContentNameX | ContentModelX>;

   public readonly listType: CpType;

   public readonly repeat: CpRepeat;

   constructor(contentModel: ContentModelP) {
      const repeatStr = strOrBlank(contentModel.repeat);
      let listType: CpType | undefined;
      const protoParticle: Array<ContentNameX | ContentModelX> = [];

      for (const aParticle of contentModel.particles) {
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
               repeat: REPEAT_MAP[strOrBlank(particle.repeat)] || CpRepeat.ONE,
            });
         }
      }

      this.listType = listType || CpType.CHOICE;
      this.repeat = REPEAT_MAP[repeatStr] || CpRepeat.ONE;
      this.particles = protoParticle;
   }
}

export { ContentModelX, ContentNameX, CpRepeat, CpType };
