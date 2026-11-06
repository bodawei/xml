/* Copyright ® 2016-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { ExternalIdP, pTokenArrayToString, TextPToken } from 'pToken';
import { strOrBlank } from 'basic';

import { wellFormedErrorCodes } from '../error/wellFormedError';
import { errorCodes } from '../error/errorCodes';
import { Error } from '../error/error';

import { literalCheck } from './literalCheck';

/**********************************************************************\
 The externalId namespace has routines for processing external ID's
 as found in ENTITY, DOCTYPE, and NOTATION declarations.

 This include parsing, validating and turning into a form ready for
 insertion into a token.
\**********************************************************************/

const WFEID = wellFormedErrorCodes.id;
const ALLOWED_TYPES = ['PUBLIC', 'SYSTEM'];
const PUBID_CHARS = /^[- \n'()+,./:=?;!*#@$_%a-zA-Z0-9]*/;

function externalIdCheck(
   externalId: ExternalIdP | undefined,
   isNotation: boolean,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   if (!externalId) {
      return;
   }

   collector.setPos(externalId.externalType);
   const typeText = strOrBlank(externalId.externalType);
   const capitalType = typeText.toLocaleUpperCase();
   collector.check(!ALLOWED_TYPES.includes(capitalType), WFEID.EXTERNALID_UNKNOWN, [typeText]);
   collector.check(typeText !== capitalType, WFEID.EXTERNALID_INVALID_CASE, [
      capitalType,
      typeText,
   ]);

   collector.setPos(externalId.externalTypeSpace);
   collector.check(!externalId.externalTypeSpace, WFEID.EXTERNALID_EXTERNALTYPE_NO_SPACE);

   if (capitalType === 'PUBLIC') {
      // This is very fragile if there is no value.
      literalCheck(externalId.public, collector, confVer, WFEID.NOUN_EXTERNALID_PUBLIC, () => {
         if (!externalId.public) {
            collector.report(WFEID.EXTERNALID_MISSING_PUBLIC_VALUE, []);
            return;
         }

         // we overprotective because because literal is too general for what we have
         if (externalId.public.value.length > 0) {
            const pubLiteral = strOrBlank((externalId.public.value[0] as TextPToken).text); // We know it has to be a string.

            const match = PUBID_CHARS.exec(pubLiteral);

            const str: string = match?.[0] ?? '';
            collector.check(match?.[0] !== pubLiteral, WFEID.EXTERNALID_PUBLIC_INVALID_CHARS, [
               pubLiteral[str.length],
            ]);
         }
      });
   }

   if (!externalId.system) {
      if (capitalType === 'SYSTEM' || (capitalType === 'PUBLIC' && !isNotation)) {
         collector.setPos(externalId.publicSpace);
         collector.report(WFEID.EXTERNALID_MISSING_SYSTEM_VALUE, []);
      }
   } else {
      if (externalId.public) {
         collector.setPos(externalId.publicSpace);
         collector.check(!externalId.publicSpace, WFEID.EXTERNALID_SYSTEM_NO_LEADING_SPACE);
      }

      literalCheck(externalId.system, collector, confVer, WFEID.NOUN_EXTERNALID_SYSTEM, () => {
         // §4.2.2 It is an error for a fragment identifier (beginning with a # character)
         //    to be part of a system identifier
         const literalString = pTokenArrayToString(externalId.system?.value);

         if (literalString.includes('#')) {
            collector.reportProblem(Error, errorCodes.id.SYSTEMLITERAL_NO_FRAGMENT, [
               literalString,
            ]);
         }
      });
   }
}

export { externalIdCheck };
