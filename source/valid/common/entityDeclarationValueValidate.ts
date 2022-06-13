/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { Collector, SToken, strOrBlank } from 'basic';
import {
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
} from 'pToken';
import { ElidedEntityDeclarationPToken, PARAMETER_ENTITY_START_PTOKEN } from 'token';

import { validityErrorCodes } from '../error/validityErrorCodes';

import { ValidityState } from './validityState';

const VID = validityErrorCodes.id;

function entityDeclarationValueValidate(
   el:
      | ParameterEntityDeclarationPToken
      | GeneralEntityDeclarationPToken
      | ElidedEntityDeclarationPToken,
   state: ValidityState,
   coll: Collector,
): void {
   const replacementText = el.value;

   for (const element of replacementText) {
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

      if (state.isStandalone || (!state.hasExternalSubset && !state.hasPeRefs && !elementName)) {
         return;
      }

      // §4.1.0Validity Constraint: Entity Declared
      // In a document with an external subset or parameter entity references,
      // if the document is not standalone (either "standalone='no'" is specified
      // or there is no standalone declaration), then the Name given in the
      // entity reference must match that in an entity declaration. ...
      // The declaration of a parameter entity must precede any reference to it. ...
      coll.check(!elementDetails, VID.PARAMETERENTITY_NO_DECLARATION, [elementName], open);
   }
}

export { entityDeclarationValueValidate };
