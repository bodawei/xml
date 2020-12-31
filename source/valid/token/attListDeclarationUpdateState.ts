/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { AttListDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { AttributeDefs, ValidateState } from '../validateState';

function attListDeclarationUpdateState(
   el: AttListDeclarationPToken,
   state: ValidateState,
): ValidateState {
   const elName = strOrBlank(el.elementName);
   const defs: AttributeDefs = state.attributeDefs[elName] || {};

   for (const def of el.attDefs) {
      const attName = strOrBlank(def.name);

      if (!defs[attName]) {
         defs[attName] = {
            def,
            isExternal: state.inExternalSubset,
         };
      }
   }

   return {
      ...state,
      attributeDefs: {
         ...state.attributeDefs,
         [elName]: defs,
      },
   };
}

export { attListDeclarationUpdateState };
