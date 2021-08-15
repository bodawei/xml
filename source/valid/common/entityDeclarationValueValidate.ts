/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import {
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
} from 'pToken';
import { SToken, strOrBlank } from 'sToken';
import { ElidedEntityDeclarationPToken, PARAMETER_ENTITY_START_PTOKEN } from 'token';
import { validCodes } from '../error/validCodes';

import { ValidateState } from './validateState';

const VID = validCodes.id;

function entityDeclarationValueValidate(
   el:
      | ParameterEntityDeclarationPToken
      | GeneralEntityDeclarationPToken
      | ElidedEntityDeclarationPToken,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   const replacementText = el.value;

   for (const element of replacementText) {
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

      if (state.isStandalone || (!state.hasExternalSubset && !state.hasPeRefs && !elementName)) {
         return;
      }

      // §4.1.0Validity Constraint: Entity Declared
      // In a document with an external subset or parameter entity references,
      // if the document is not standalone (either "standalone='no'" is specified
      // or there is no standalone declaration), then the Name given in the
      // entity reference must match that in an entity declaration. ...
      // The declaration of a parameter entity must precede any reference to it. ...
      ec.check(!elementDetails, VID.PARAMETERENTITY_NO_DECLARATION, [elementName], open);
   }
}

export { entityDeclarationValueValidate };
