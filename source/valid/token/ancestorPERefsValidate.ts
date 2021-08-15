/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { ParameterEntityReferencePToken, PARAMETER_ENTITY_REFERENCE_PTOKEN } from 'pToken';
import { SToken, strOrBlank } from 'sToken';
import {
   EntityValuePToken,
   GeneralEntityStartPToken,
   GENERAL_ENTITY_START_PTOKEN,
   ParameterEntityStartPToken,
   PARAMETER_ENTITY_START_PTOKEN,
} from 'token';

import { ValidateState } from '../common/validateState';
import { validCodes } from '../error/validCodes';

const VID = validCodes.id;

function ancestorPERefsValidate(
   startPToken:
      | GeneralEntityStartPToken
      | ParameterEntityStartPToken
      | ParameterEntityReferencePToken,
   state: ValidateState,
   ec: ErrorCollector,
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

      // @@@ Will we actually ever get a pe start?
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
         ec.report(VID.ENTITYREF_EXTERNAL, [elementName], open);
      } else {
         ancestorPERefsValidate(element, state, ec);
      }
   }
}

export { ancestorPERefsValidate };
