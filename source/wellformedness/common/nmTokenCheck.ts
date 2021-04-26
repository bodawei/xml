/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, isNmToken } from 'basic';
import { SToken } from 'sToken';

/**********************************************************************\
 nmTokenCheck() validates that the specified SToken matches the basic
 character requirements for nmtokens.
\**********************************************************************/

function nmTokenCheck(
   nameTokenSToken: SToken | undefined,
   ec: ErrorCollector,
   confVers: ConformanceVersion,
   errorCode: string,
): void {
   if (!nameTokenSToken || isNmToken(nameTokenSToken.str, confVers.version, confVers.edition)) {
      return;
   }

   ec.report(errorCode, [nameTokenSToken.str], nameTokenSToken);
}

export { nmTokenCheck };
