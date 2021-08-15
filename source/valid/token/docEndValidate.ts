/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';

import { IdRefDetails, ValidateState } from '../common/validateState';
import { validCodes } from '../error/validCodes';

const VID = validCodes.id;

function docEndValidate(state: ValidateState, ec: ErrorCollector): void {
   const refValues = Object.keys(state.idRefs);
   const idvalues = Object.keys(state.ids);
   const idMap: Record<string, boolean> = {};

   for (const idValue of idvalues) {
      idMap[idValue] = true;
   }

   for (const refValue of refValues) {
      const details = state.idRefs[refValue] as IdRefDetails;

      // §3.3.1: Validity Constraint: IDREF
      //    each Name must match the value of an ID attribute on some element
      //    in the XML document; i.e. IDREF values must match the value of
      //    some ID attribute.
      ec.check(
         !idMap[refValue],
         VID.ELEMENTSTART_ATT_IDREF_NO_ID,
         [details.elName, details.attName, refValue],
         details.sToken,
      );
   }
}

export { docEndValidate };
