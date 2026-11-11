/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { Collector, strOrBlank } from 'basic';
import { AttDefinitionP } from 'pToken';

import { Error } from '../error/error';
import { errorCodes } from '../error/errorCodes';
import { ValidityState } from './validityState';

const EID = errorCodes.id;

/*
 * Validates whether the xml:space attribute is declared correctly.
 */
function xmlSpaceValidate(
   attDef: AttDefinitionP,
   elName: string,
   attName: string,
   state: ValidityState,
   coll: Collector,
): void {
   if (
      attName.toLowerCase() !== 'xml:space' ||
      (state.confVer.version === 1.0 && state.confVer.edition < 3)
   ) {
      return;
   }

   const words = attDef.enumeration?.words ?? [];

   coll.setPos(attDef.name);

   // §2.10: concerning xml:space:
   //    it must be given as an enumerated type whose values are one or both of "default"
   //    and "preserve". ... It is an error for other values to be specified; the XML
   //    processor may report the error or may recover by ignoring the attribute
   //    specification or by reporting the (erroneous) value to the application.
   //    Applications may ignore or reject erroneous values.
   if (words.length === 0) {
      coll.reportProblem(Error, EID.XMLSPACE_NO_ENUMERATED_VALUES, [elName]);
   }

   for (const wordPToken of words) {
      const aName = strOrBlank(wordPToken.word);

      coll.setPos(wordPToken.word);

      if (aName !== 'preserve' && aName !== 'default') {
         coll.reportProblem(Error, EID.XMLSPACE_XTRA_ENUMERATED_VALUE, [elName, aName]);
      }
   }
}

export { xmlSpaceValidate };
