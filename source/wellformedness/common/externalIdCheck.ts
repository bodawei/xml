/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { ExternalIdP, TextPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { WellFormedError } from '../error/WellFormedError';
//ik
import literal from '../../token/common/literal'; // ick

/**********************************************************************\
 The externalId namespace has routines for processing external ID's
 as found in ENTITY, DOCTYPE, and NOTATION declarations.

 This include parsing, validating and turning into a form ready for
 insertion into a token.
\**********************************************************************/

const WFEID = WellFormedError.ID;
const ALLOWED_TYPES = ['PUBLIC', 'SYSTEM'];
const PUBID_CHARS = /^[- \n'()+,./:=?;!*#@$_%a-zA-Z0-9]*/;

function externalIdCheck(
   externalId: ExternalIdP | undefined,
   isNotation: boolean,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   if (!externalId) {
      return;
   }

   ec.setPos(externalId.externalType);
   const typeText = strOrBlank(externalId.externalType);
   const capitalType = typeText.toLocaleUpperCase();
   ec.check(ALLOWED_TYPES.indexOf(capitalType) === -1, WFEID.EXTERNALID_UNKNOWN, [typeText]);
   ec.check(typeText !== capitalType, WFEID.EXTERNALID_INVALID_CASE, [capitalType, typeText]);

   ec.setPos(externalId.externalTypeSpace);
   ec.check(!externalId.externalTypeSpace, WFEID.EXTERNALID_EXTERNALTYPE_NO_SPACE);

   if (capitalType === 'PUBLIC') {
      // This is very fragile if there is no value.
      literal.checkWellFormed(externalId.public, ec, confVer, WFEID.NOUN_EXTERNALID_PUBLIC, () => {
         if (!externalId.public) {
            ec.report(WFEID.EXTERNALID_MISSING_PUBLIC_VALUE, []);
            return;
         }

         // we overprotective because because literal is too general for what we have
         if (externalId.public.value.length > 0) {
            const pubLiteral = strOrBlank((externalId.public.value[0] as TextPToken).text); // We know it has to be a string.

            const match = PUBID_CHARS.exec(pubLiteral);

            const str: string = (match && match[0]) || '';
            ec.check(!match || match[0] !== pubLiteral, WFEID.EXTERNALID_PUBLIC_INVALID_CHARS, [
               pubLiteral[str.length],
            ]);
         }
      });
   }

   if (!externalId.system) {
      if (capitalType === 'SYSTEM' || (capitalType === 'PUBLIC' && !isNotation)) {
         ec.setPos(externalId.publicSpace);
         ec.report(WFEID.EXTERNALID_MISSING_SYSTEM_VALUE, []);
      }
   } else {
      if (externalId.public) {
         ec.setPos(externalId.publicSpace);
         ec.check(!externalId.publicSpace, WFEID.EXTERNALID_SYSTEM_NO_LEADING_SPACE);
      }

      literal.checkWellFormed(externalId.system, ec, confVer, WFEID.NOUN_EXTERNALID_SYSTEM);
   }
}

export { externalIdCheck };
