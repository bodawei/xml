/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ErrorCollector, XmlWarning } from 'error';
import { strOrBlank } from 'sToken';

import { GeneralEntityReferencePToken } from 'token';

import { ValidityError } from '../error/ValidityError';
import { ValidateState } from '../validateState';

const PREDEFINED = ['lt', 'gt', 'quot', 'apos', 'amp'];
const VEID = ValidityError.ID;
const WARNID = XmlWarning.ID;

function generalEntityReferenceValidate(
   token: GeneralEntityReferencePToken,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   const geDeclName = strOrBlank(token.name);
   const isDeclared = !!state.generalEntities[geDeclName];

   if (isDeclared) {
      return;
   }

   ec.setPos(token.open);
   ec.setPos(token.name);
   /*
    * §4.1.0: Validity Constraint: Entity Declared
    *    In a document with an external subset or parameter entity references with
    *    "standalone='no'", the Name given in the entity reference must match that
    *    in an entity declaration. ...
    */
   if (!PREDEFINED.includes(geDeclName)) {
      ec.report(VEID.GEREF_UNDEFINED, [geDeclName]);
   } else {
      /*
       * §4.1.0: Validity Constraint: Entity Declared
       *    For interoperability, valid documents should declare the entities
       *    amp, lt, gt, apos, quot, in the form specified in 4.6 Predefined Entities.
       */
      ec.reportError(WARNID.PREDEFINED_UNDECLARED, XmlWarning, [geDeclName]);
   }
}

export { generalEntityReferenceValidate };
