/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector, warning, WarningToken } from 'basic';
import { GENERAL_ENTITY_REFERENCE_PTOKEN } from 'pToken';
import { SToken, strOrBlank } from 'sToken';
import { GENERAL_ENTITY_START_PTOKEN, LiteralValuePToken } from 'token';
import { validCodes } from '../error/validCodes';
import { ValidateState } from './validateState';

const VID = validCodes.id;
const WARNID = warning.id;
const PREDEFINED = ['lt', 'gt', 'quot', 'apos', 'amp'];

function attributeValueValidate(
   attValue: LiteralValuePToken,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   if ((!state.hasExternalSubset && !state.hasPeRefs) || state.isStandalone) {
      return;
   }

   for (const element of attValue) {
      let geName: string | undefined;
      let start: SToken | undefined;

      if (element.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         geName = strOrBlank(element.name);
         start = element.open;
      } else if (element.type === GENERAL_ENTITY_START_PTOKEN) {
         geName = strOrBlank(element.referencePToken.name);
         start = element.referencePToken.open;
      }

      // @@ This is kinda duplicated with generalEntityReferenceValidate. consolidate?
      if (geName && !state.generalEntities[geName]) {
         if (!PREDEFINED.includes(geName)) {
            /*
             * §4.1.0: Validity Constraint: Entity Declared
             *    In a document with an external subset or parameter entity references with
             *    "standalone='no'", the Name given in the entity reference must match that
             *    in an entity declaration. ...
             */
            ec.report(VID.GENERALENTITY_NO_DECLARATION, [geName], start);
         } else {
            /*
             * §4.1.0: Validity Constraint: Entity Declared
             *    For interoperability, valid documents should declare the entities
             *    amp, lt, gt, apos, quot, in the form specified in 4.6 Predefined Entities.
             */
            ec.reportError(WARNID.ENTITY_PREDEFINED_NO_DECLARATION, WarningToken, [geName], start);
         }
      }
   }
}

export { attributeValueValidate };
