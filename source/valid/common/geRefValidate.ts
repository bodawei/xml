/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { Collector } from 'basic';
import { GeneralEntityReferencePToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { PREDEFINED_ENTITIES } from '../common/constants';
import { ValidityState } from '../common/validityState';
import { validityErrorCodes } from '../error/validityErrorCodes';
import { Warning } from '../error/warning';
import { warningCodes } from '../error/warningCodes';

const VID = validityErrorCodes.id;
const WARNID = warningCodes.id;

function geRefValidate(
   token: GeneralEntityReferencePToken,
   state: ValidityState,
   coll: Collector,
): void {
   const geDeclName = strOrBlank(token.name);
   const isDeclared = !!state.generalEntities[geDeclName];
   const hasExtSubsetOrPeRefs = state.hasExternalSubset || state.hasPeRefs;

   if (isDeclared || !hasExtSubsetOrPeRefs || state.isStandalone) {
      return;
   }

   coll.setPos(token.open);
   coll.setPos(token.name);
   /*
    * §4.1.0: Validity Constraint: Entity Declared
    *    In a document with an external subset or parameter entity references with
    *    "standalone='no'", the Name given in the entity reference must match that
    *    in an entity declaration. ...
    */
   if (!PREDEFINED_ENTITIES.includes(geDeclName)) {
      coll.report(VID.GENERALENTITY_NO_DECLARATION, [geDeclName]);
   } else {
      /*
       * §4.1.0: Validity Constraint: Entity Declared
       *    For interoperability, valid documents should declare the entities
       *    amp, lt, gt, apos, quot, in the form specified in 4.6 Predefined Entities.
       */
      coll.reportProblem(Warning, WARNID.ENTITY_PREDEFINED_NO_DECLARATION, [geDeclName]);
   }
}

export { geRefValidate };
