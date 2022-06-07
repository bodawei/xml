/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { Collector } from 'basic';
import { ParameterEntityReferencePToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { ValidityState } from '../common/validityState';
import { validityErrorCodes } from '../error/validityErrorCodes';

const VID = validityErrorCodes.id;

function parameterEntityReferenceValidate(
   token: ParameterEntityReferencePToken,
   state: ValidityState,
   coll: Collector,
): void {
   const peDeclName = strOrBlank(token.name);

   coll.setPos(token.open);
   coll.setPos(token.name);

   // §4.1.0: Validity Constraint: Entity Declared
   //    In a document with an external subset or parameter entity references with
   //    "standalone='no'", the Name given in the entity reference must match that
   //    in an entity declaration. ... The declaration of a parameter entity must
   //    precede any reference to it...

   /*
    * Theoretically we should check whether there is an external subset or PE refs...
    * But, this IS a PERef, so there are some (true | false) | true is true.
    */
   const applies = !state.isStandalone;

   coll.check(!state.parameterEntities[peDeclName] && applies, VID.PARAMETERENTITY_NO_DECLARATION, [
      peDeclName,
   ]);
}

export { parameterEntityReferenceValidate };
