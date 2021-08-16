/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { ParameterEntityReferencePToken } from 'pToken';
import { strOrBlank } from 'sToken';
import { validCodes } from '../error/validCodes';

import { ValidityState } from '../common/validityState';

const VID = validCodes.id;

function parameterEntityReferenceValidate(
   token: ParameterEntityReferencePToken,
   state: ValidityState,
   ec: ErrorCollector,
): void {
   const peDeclName = strOrBlank(token.name);

   ec.setPos(token.open);
   ec.setPos(token.name);
   /*
    * §4.1.0: Validity Constraint: Entity Declared
    *    In a document with an external subset or parameter entity references with
    *    "standalone='no'", the Name given in the entity reference must match that
    *    in an entity declaration. ... The declaration of a parameter entity must
    *    precede any reference to it...
    */
   // Theoretically we should check whether there is an external subset or PE refs...
   // But, this IS a PERef, so there are some.
   const applies = !state.isStandalone;

   ec.check(!state.parameterEntities[peDeclName] && applies, VID.PARAMETERENTITY_NO_DECLARATION, [
      peDeclName,
   ]);
}

export { parameterEntityReferenceValidate };
