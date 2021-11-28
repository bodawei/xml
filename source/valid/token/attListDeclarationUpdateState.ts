/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { AttListDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { AttributeDetails, ValidityState } from '../common/validityState';

function attListDeclarationUpdateState(
   el: AttListDeclarationPToken,
   state: ValidityState,
): ValidityState {
   const elName = strOrBlank(el.elementName);
   const defs = state.attributes[elName] || {};
   const newDefs: Record<string, AttributeDetails> = {};

   // Add the individual attribute declarations to the ones we already have for this element.
   for (const def of el.attDefs) {
      const attName = strOrBlank(def.name);

      if (!defs[attName]) {
         newDefs[attName] = {
            def,
            isExternalMarkupDeclaration: state.dtdContext.inExternalMarkupContext,
         };
      }
   }

   return new ValidityState(state, {
      attributes: {
         [elName]: {
            ...defs,
            ...newDefs,
         },
      },
   });
}

export { attListDeclarationUpdateState };
