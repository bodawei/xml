/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { ParameterEntityReferencePToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { ValidityError } from '../error/ValidityError';
import { ValidateState } from '../validateState';

const VID = ValidityError.ID;

function parameterEntityReferenceValidate(
   token: ParameterEntityReferencePToken,
   state: ValidateState,
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
   ec.check(!state.parameterEntities[peDeclName], VID.PEREF_UNDEFINED, [peDeclName]);
}

export { parameterEntityReferenceValidate };
