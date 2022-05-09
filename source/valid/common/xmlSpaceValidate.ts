/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { AttDefinitionP } from 'pToken';
import { strOrBlank } from 'sToken';
import { ValidityState } from './validityState';
import { ErrorToken } from '../error/errorToken';
import { errorCodes } from '../error/errorCodes';

const EID = errorCodes.id;

/*
 * Validates whether the xml:space attribute is declared correctly.
 */
function xmlSpaceValidate(
   attDef: AttDefinitionP,
   elName: string,
   attName: string,
   state: ValidityState,
   ec: ErrorCollector,
): void {
   if (
      attName.toLowerCase() !== 'xml:space' ||
      (state.confVer.version === 1.0 && state.confVer.edition < 3)
   ) {
      return;
   }

   const words = attDef.enumeration?.words ?? [];

   ec.setPos(attDef.name);

   // §2.10: concerning xml:space:
   //    it must be given as an enumerated type whose values are one or both of "default"
   //    and "preserve". ... It is an error for other values to be specified; the XML
   //    processor may report the error or may recover by ignoring the attribute
   //    specification or by reporting the (erroneous) value to the application.
   //    Applications may ignore or reject erroneous values.
   if (words.length === 0) {
      ec.reportError(EID.XMLSPACE_NO_ENUMERATED_VALUES, ErrorToken, [elName]);
   }

   for (const wordPToken of words) {
      const aName = strOrBlank(wordPToken.word);

      ec.setPos(wordPToken.word);

      if (aName !== 'preserve' && aName !== 'default') {
         ec.reportError(EID.XMLSPACE_XTRA_ENUMERATED_VALUE, ErrorToken, [elName, aName]);
      }
   }
}

export { xmlSpaceValidate };
