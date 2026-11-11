// import { ParseToken } from "pToken";
import { SToken } from 'basic';

import { DOCTYPE_END_PTOKEN } from './docTypeEnd';
import { GENERAL_ENTITY_END_PTOKEN } from './marker/generalEntityEnd';
import { GENERAL_ENTITY_START_PTOKEN } from './marker/generalEntityStart';
import { PARAMETER_ENTITY_START_PTOKEN } from './marker/parameterEntityStart';

function getFirstSToken(pToken: any): SToken {
   let startContext;

   if (pToken.type === DOCTYPE_END_PTOKEN) {
      startContext = pToken.closeSubset; // eh?  And what if there is no close?
   } else if (pToken.type === PARAMETER_ENTITY_START_PTOKEN) {
      startContext = pToken.referencePToken.open;
   } else if (
      pToken.type === GENERAL_ENTITY_START_PTOKEN ||
      pToken.type === GENERAL_ENTITY_END_PTOKEN
   ) {
      startContext = pToken.referencePToken.open;
   } else {
      startContext = (pToken as any).open || (pToken as any).text;
   }

   return startContext;
}

export { getFirstSToken };
