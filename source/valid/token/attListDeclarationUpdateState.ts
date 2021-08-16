/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { AttListDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { AttributeDetails, ValidityState } from '../common/validityState';

function attListDeclarationUpdateState(
   el: AttListDeclarationPToken,
   state: ValidityState,
): ValidityState {
   const elName = strOrBlank(el.elementName);
   const defs: AttributeDetails = state.attributes[elName] || {};

   for (const def of el.attDefs) {
      const attName = strOrBlank(def.name);

      if (!defs[attName]) {
         defs[attName] = {
            def,
            isExternalMarkupDeclaration: state.dtdContext.inExternalMarkupContext,
         };
      }
   }

   return {
      ...state,
      attributes: {
         ...state.attributes,
         [elName]: defs,
      },
   };
}

export { attListDeclarationUpdateState };
