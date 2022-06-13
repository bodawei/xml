/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'basic';
import { ElementDeclarationPToken, isContentModelP } from 'pToken';

import { makeCmGraph } from '../contentModel/makeCmGraph';

import { ElDeclType, ValidityState, ContentDetails } from './validityState';

function elementDeclarationPreprocess(
   elDecl: ElementDeclarationPToken,
   state: ValidityState,
): ContentDetails {
   const names: Array<string> = [];
   let hasContentModel = false;
   let hasPcData = false;

   if (!elDecl.contentModel) {
      const spec = strOrBlank(elDecl.contentSpec).toUpperCase();

      return {
         isExternalMarkupDeclaration: state.dtdContext.inExternalMarkupContext,
         token: elDecl,
         type: spec === 'EMPTY' ? ElDeclType.EMPTY : ElDeclType.ANY,
      };
   }

   for (const delimParticle of elDecl.contentModel.delimitedParticles) {
      if (!delimParticle.particle || isContentModelP(delimParticle.particle)) {
         hasContentModel = true;
      } else {
         const name = strOrBlank(delimParticle.particle.name);
         const isPcData = name.toUpperCase() === '#PCDATA';

         hasPcData ||= isPcData;

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
