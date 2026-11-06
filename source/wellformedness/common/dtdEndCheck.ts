/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { TEXT_PTOKEN } from 'pToken';
import { strOrBlank } from 'basic';
import { LiteralValuePToken } from 'token';
import { CheckState, GeneralEntitiesInfo } from '../checkUtils';
import { FatalError } from '../error/fatalError';
import { fatalErrorCodes } from '../error/fatalErrorCodes';
import { Warning } from '../error/warning';
import { warningCodes } from '../error/warningCodes';
import { errorCodes } from '../error/errorCodes';
import { Error } from '../error/error';

const GE_REF_REGEXP = /&([^;]*);/g;
const WID = warningCodes.id;

function checkEntity(
   value: LiteralValuePToken,
   geDetails: GeneralEntitiesInfo,
   collector: Collector,
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
                  ? fatalErrorCodes.id.REFERENCE_INVALID_UNPARSED
                  : errorCodes.id.REFERENCE_INVALID_UNPARSED;
               collector.setPos(element.text);
               collector.reportProblem(isForbidden ? FatalError : Error, code, [name]);
            }
         }

         ampIndex = contents.indexOf('&', ampIndex + 1);
      }
   }
}

function dtdEndCheck(state: CheckState, collector: Collector): void {
   const geValues = Object.values(state.generalDecls);
   const peValues = Object.values(state.paramDecls);

   for (const entry of geValues) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      checkEntity(entry!.token.value, state.generalDecls, collector, state.confVer);
   }

   for (const entry of peValues) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      checkEntity(entry!.value, state.generalDecls, collector, state.confVer);
   }

   for (const elName of Object.keys(state.atts ?? {})) {
      if (!state.elementDecl[elName]) {
         // §4.2 If the same entity is declared more than once, ... at user option,
         // an XML processor may issue a warning if entities are declared multiple times.
         collector.reportProblem(
            Warning,
            WID.ATTLISTDECL_NO_ELEMENTDECL,
            [elName],
            undefined, // seems like a prolem
         );
      }
   }
}

export { dtdEndCheck };
