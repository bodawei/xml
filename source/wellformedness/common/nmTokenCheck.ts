/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector, isNmToken } from 'basic';
import { SToken } from 'basic';

/**********************************************************************\
 nmTokenCheck() validates that the specified SToken matches the basic
 character requirements for nmtokens.
\**********************************************************************/

function nmTokenCheck(
   nameTokenSToken: SToken | undefined,
   collector: Collector,
   confVers: ConformanceVersion,
   errorCode: string,
): void {
   if (!nameTokenSToken || isNmToken(nameTokenSToken.str, confVers.version, confVers.edition)) {
      return;
   }

   collector.report(errorCode, [nameTokenSToken.str], nameTokenSToken);
}

export { nmTokenCheck };
