/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, isName } from 'basic';
import { SToken } from 'sToken';

/**********************************************************************\
 checkName() validates that the specified SToken matches the basic
 character requirements for names.
\**********************************************************************/

function nameCheck(
   nameSToken: SToken | undefined,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
   errorCode: string,
): void {
   if (!nameSToken || isName(nameSToken.str, confVer.version, confVer.revision)) {
      return;
   }

   ec.report(errorCode, [nameSToken.str], nameSToken);
}

export { nameCheck };
