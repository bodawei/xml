/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ContentModelP, ElementDeclarationPToken, isContentModelP } from 'pToken';
import { strOrBlank } from 'sToken';

import { makeCmGraph } from '../contentModal/makeCmGraph';
import { DeclarationDetails, ElDeclType, ValidateState } from '../validateState';

interface DetailsFragment {
   names: Array<string>;
   duplicateNames: Array<string>;
}

function extractNames(contentModel: ContentModelP): DetailsFragment {
   const names: Array<string> = [];
   const duplicateNames: Array<string> = [];

   for (const dp of contentModel.delimitedParticles) {
      if (!dp.particle || isContentModelP(dp.particle)) {
         continue;
      }

      const newName = strOrBlank(dp.particle.name);
      const ucNewName = newName.toUpperCase();

      if (ucNewName === '#PCDATA') {
         continue;
      }

      if (names.includes(newName)) {
         if (!duplicateNames.includes(newName)) {
            duplicateNames.push(newName);
         }
      } else {
         names.push(newName);
      }
   }

   return { names, duplicateNames };
}

function elementDeclarationUpdateState(
   elDecl: ElementDeclarationPToken,
   state: ValidateState,
): ValidateState {
   const elName = strOrBlank(elDecl.name);
   const ucSpec = strOrBlank(elDecl.contentSpec).toLocaleUpperCase();
   let entry: DeclarationDetails = {
      token: elDecl,
      type: ElDeclType.ANY,
   };

   if (state.elementDeclarations[elName]) {
      return state;
   }

   if (elDecl.contentModel) {
      if (elDecl.contentModel.delimitedParticles.length === 0) {
         // if nothing in the model, lets treat it as an empty
         entry = {
            token: elDecl,
            type: ElDeclType.EMPTY,
         };
      } else {
         const first = elDecl.contentModel.delimitedParticles[0];
         let isMixed = false;

         if (first.particle && 'name' in first.particle) {
            const ucName = strOrBlank(first.particle.name).toLocaleUpperCase();

            if (ucName === '#PCDATA') {
               isMixed = true;
               entry = {
                  token: elDecl,
                  type: ElDeclType.MIXED,
                  ...extractNames(elDecl.contentModel),
               };
            }
         }

         if (!isMixed) {
            entry = {
               token: elDecl,
               type: ElDeclType.CHILDREN,
               graph: makeCmGraph(elDecl.contentModel),
            };
         }
      }
   } else if (ucSpec === 'EMPTY') {
      entry = {
         token: elDecl,
         type: ElDeclType.EMPTY,
      };
   }

   state.elementDeclarations[elName] = entry;

   return state;
}

export { elementDeclarationUpdateState };
