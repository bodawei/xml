/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { Collector, SToken, strOrBlank } from 'basic';
import { ParameterEntityReferencePToken, PARAMETER_ENTITY_REFERENCE_PTOKEN } from 'pToken';
import {
   EntityValuePToken,
   GeneralEntityStartPToken,
   GENERAL_ENTITY_START_PTOKEN,
   ParameterEntityStartPToken,
   PARAMETER_ENTITY_START_PTOKEN,
} from 'token';

import { validityErrorCodes } from '../error/validityErrorCodes';
import { ValidityState } from './validityState';

const VID = validityErrorCodes.id;

/*
 * Recursively walk up the tree of enetities, amd validate that if this document
 * is marked as standalone, that all the entities are non-external
 */
function ancestorPERefsValidate(
   startPToken:
      | GeneralEntityStartPToken
      | ParameterEntityStartPToken
      | ParameterEntityReferencePToken,
   state: ValidityState,
   coll: Collector,
): void {
   if (!state.isStandalone) {
      return;
   }

   let name: string;
   let entityValues: EntityValuePToken;

   if (startPToken.type == GENERAL_ENTITY_START_PTOKEN) {
      name = strOrBlank(startPToken.referencePToken.name);
      const details = state.generalEntities[name];
      entityValues = details?.token.value ?? [];
   } else if (startPToken.type == PARAMETER_ENTITY_REFERENCE_PTOKEN) {
      name = strOrBlank(startPToken.name);
      const details = state.parameterEntities[name];
      entityValues = details?.replacementText ?? [];
   } else {
      name = strOrBlank(startPToken.referencePToken.name);
      const details = state.parameterEntities[name];
      entityValues = details?.replacementText ?? [];
   }

   for (const element of entityValues) {
      let elementName: string | undefined;
      let open: SToken | undefined;

      if (element.type === PARAMETER_ENTITY_START_PTOKEN) {
         elementName = strOrBlank(element.referencePToken.name);
         open = element.referencePToken.open;
      } else if (element.type === PARAMETER_ENTITY_REFERENCE_PTOKEN) {
         elementName = strOrBlank(element.name);
         open = element.open;
      } else {
         continue;
      }

      const elementDetails = state.parameterEntities[elementName];

      if (elementDetails?.isExternalMarkupDeclaration) {
         // §2.9.0 Validity Constraint: Standalone Document Declaration
         //    ...entities (other than amp, lt, gt, apos, quot), if references to
         //    those entities appear in the document...
         /*
          * NOTE: Since this is just evaluating the chain of parameter entities,
          * this does not need to worry about the predefined entities
          */
         coll.report(VID.ENTITYREF_EXTERNAL, [elementName], open);
      } else {
         ancestorPERefsValidate(element, state, coll);
      }
   }
}

export { ancestorPERefsValidate };
