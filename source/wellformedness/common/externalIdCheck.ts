/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { WellFormedError, ErrorCollector } from 'error';
import { SToken, strOrBlank } from 'sToken';
import { TEXT_PTOKEN } from 'token';

import { ExternalId } from '../../pToken/common/externalId'; // ick

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
   externalId: ExternalId | undefined,
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
         if (!externalId.public || !externalId.public.value) {
            return;
         }
         let sToken: SToken | undefined;

         // we are so confused
         if (externalId.public.value.length > 0) {
            if (externalId.public.value[0].type === TEXT_PTOKEN) {
               sToken = externalId.public.value[0].text;
               // } else {
               //    sToken = externalId.public.value[0].str;
            }

            const match = PUBID_CHARS.exec(sToken?.str || '');

            const str: string = (match && match[0]) || '';
            ec.check(!match || match[0] !== sToken?.str, WFEID.EXTERNALID_PUBLIC_INVALID_CHARS, [
               (sToken?.str || '')[str.length],
            ]);
         }
      });
   }

   if (capitalType === 'SYSTEM' || externalId.system) {
      if (externalId.public && externalId.public.value) {
         ec.setPos(externalId.publicSpace);
         ec.check(!externalId.publicSpace, WFEID.EXTERNALID_SYSTEM_NO_LEADING_SPACE);
      }

      literal.checkWellFormed(externalId.system, ec, confVer, WFEID.NOUN_EXTERNALID_SYSTEM);
   }
}

export { externalIdCheck };
