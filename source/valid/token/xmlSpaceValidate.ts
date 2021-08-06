/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector, ErrorToken } from 'basic';
import { AttDefinitionP } from 'pToken';
import { strOrBlank } from 'sToken';

import { validError } from '../error/validError';

const EID = validError.id;

function xmlSpaceValidate(
   attDef: AttDefinitionP,
   elName: string,
   attName: string,
   ec: ErrorCollector,
): void {
   if (attName.toLowerCase() !== 'xml:space') {
      return;
   }

   const names = [];

   for (const word of attDef.enumeration?.words ?? []) {
      names.push(strOrBlank(word.word));
   }

   ec.setPos(attDef.name);

   // §2.10: concerning xml:space:
   //    it must be given as an enumerated type whose values are one or both of "default"
   //    and "preserve". ... It is an error for other values to be specified; the XML
   //    processor may report the error or may recover by ignoring the attribute
   //    specification or by reporting the (erroneous) value to the application.
   //    Applications may ignore or reject erroneous values.
   if (attName !== 'xml:space') {
      ec.reportError(EID.XML_SPACE_BAD_CASE, ErrorToken, [elName, attName]);
   }

   if (names.length === 0) {
      ec.reportError(EID.XML_SPACE_BAD_DECLARATION, ErrorToken, [elName]);
   }

   for (const aName of names) {
      if (aName !== 'preserve' && aName !== 'default') {
         ec.reportError(EID.XML_SPACE_BAD_ENUMRATION, ErrorToken, [elName, aName]);
      }
   }
}

export { xmlSpaceValidate };
