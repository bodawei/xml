import { ElementDeclarationPToken, isContentModelP } from 'pToken';
import { strOrBlank } from 'sToken';

import { makeCmGraph } from '../contentModal/makeCmGraph';
import { ElDeclType } from '../validateState';

import { DeclarationDetails } from '../validateState';

function elementDeclarationPreprocess(elDecl: ElementDeclarationPToken): DeclarationDetails {
   const names: Array<string> = [];
   let hasContentModel = false;
   let hasPcData = false;

   if (!elDecl.contentModel) {
      return {
         token: elDecl,
         type:
            strOrBlank(elDecl.contentSpec).toUpperCase() === 'EMPTY'
               ? ElDeclType.EMPTY
               : ElDeclType.ANY,
      };
   }

   if (elDecl.contentModel.delimitedParticles.length === 0) {
      return { token: elDecl, type: ElDeclType.EMPTY };
   }

   for (const delimParticle of elDecl.contentModel.delimitedParticles) {
      if (!delimParticle.particle || isContentModelP(delimParticle.particle)) {
         hasContentModel = true;
      } else {
         const name = strOrBlank(delimParticle.particle.name);
         const isPcData = name.toUpperCase() === '#PCDATA';

         hasPcData = hasPcData || isPcData;

         if (!isPcData) {
            names.push(name);
         }
      }
   }

   if (hasContentModel || !hasPcData) {
      return {
         graph: makeCmGraph(elDecl.contentModel),
         token: elDecl,
         type: ElDeclType.ELEMENT,
      };
   } else {
      return {
         names,
         token: elDecl,
         type: ElDeclType.MIXED,
      };
   }
}

export { elementDeclarationPreprocess };
