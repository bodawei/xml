/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, error, ErrorToken } from 'basic';
import { TEXT_PTOKEN } from 'pToken';
import { strOrBlank } from 'sToken';
import { LiteralValuePToken } from 'token';
import { CheckState, GeneralEntitiesInfo } from '../checkUtils';
import { FatalErrorToken } from '../error/fatalErrorToken';
import { fatalError } from '../error/fatalError';
import { WellFormedWarning } from '../error/wellFormedWarning';
import { wellFormedWarningCodes } from '../error/wellFormedWarningCodes';

const GE_REF_REGEXP = /&([^;]*);/g;
const WARNID = wellFormedWarningCodes.id;

function checkEntity(
   value: LiteralValuePToken,
   geDetails: GeneralEntitiesInfo,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
) {
   // E55 in https://www.w3.org/XML/xml-V10-2e-errata changed how this should be reported
   const isForbidden = confVer.version === 1 && confVer.edition < 3;

   for (const element of value) {
      if (element.type !== TEXT_PTOKEN) {
         continue;
      }

      const contents = strOrBlank(element.text);
      let ampIndex = contents.indexOf('&');

      while (ampIndex !== -1) {
         GE_REF_REGEXP.lastIndex = ampIndex;
         const match = GE_REF_REGEXP.exec(contents);

         if (match) {
            const name = match[1].trim();
            const details = geDetails[name];
            const isUnparsed = !!details?.token.nDataName;

            if (isUnparsed) {
               const code = isForbidden
                  ? fatalError.id.REFERENCE_INVALID_UNPARSED
                  : error.id.REFERENCE_INVALID_UNPARSED;
               ec.setPos(element.text);
               ec.reportError(code, isForbidden ? FatalErrorToken : ErrorToken, [name]);
            }
         }

         ampIndex = contents.indexOf('&', ampIndex + 1);
      }
   }
}

function dtdEndCheck(state: CheckState, ec: ErrorCollector): void {
   const geValues = Object.values(state.generalDecls);
   const peValues = Object.values(state.paramDecls);

   for (const entry of geValues) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      checkEntity(entry!.token.value, state.generalDecls, ec, state.confVer);
   }

   for (const entry of peValues) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      checkEntity(entry!.value, state.generalDecls, ec, state.confVer);
   }

   for (const elName of Object.keys(state.atts ?? {})) {
      if (!state.elementDecl[elName]) {
         // §4.2 If the same entity is declared more than once, ... at user option,
         // an XML processor may issue a warning if entities are declared multiple times.
         ec.reportError(
            WARNID.ATTLISTDECL_NO_ELEMENTDECL,
            WellFormedWarning,
            [elName],
            undefined, // seems like a prolem
         );
      }
   }
}

export { dtdEndCheck };
