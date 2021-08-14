import { ElementDeclarationPToken, isContentModelP } from 'pToken';
import { strOrBlank } from 'sToken';

import { makeCmGraph } from '../contentModel/makeCmGraph';
import { ElDeclType, ValidateState } from '../validateState';

import { DeclarationDetails } from '../validateState';

function elementDeclarationPreprocess(
   elDecl: ElementDeclarationPToken,
   state: ValidateState,
): DeclarationDetails {
   const names: Array<string> = [];
   let hasContentModel = false;
   let hasPcData = false;

   if (!elDecl.contentModel) {
      return {
         isExternalMarkupDeclaration: state.dtdContext.inExternalMarkupContext,
         token: elDecl,
         type:
            strOrBlank(elDecl.contentSpec).toUpperCase() === 'EMPTY'
               ? ElDeclType.EMPTY
               : ElDeclType.ANY,
      };
   }

   // @@@@ This seems a bit weird
   if (elDecl.contentModel.delimitedParticles.length === 0) {
      return {
         isExternalMarkupDeclaration: state.dtdContext.inExternalMarkupContext,
         token: elDecl,
         type: ElDeclType.EMPTY,
      };
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
         isExternalMarkupDeclaration: state.dtdContext.inExternalMarkupContext,
         token: elDecl,
         type: ElDeclType.ELEMENT,
      };
   } else {
      return {
         isExternalMarkupDeclaration: state.dtdContext.inExternalMarkupContext,
         names,
         token: elDecl,
         type: ElDeclType.MIXED,
      };
   }
}

export { elementDeclarationPreprocess };
