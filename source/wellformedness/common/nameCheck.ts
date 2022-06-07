/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector, isName } from 'basic';
import { SToken } from 'sToken';

/**********************************************************************\
 checkName() validates that the specified SToken matches the basic
 character requirements for names.
\**********************************************************************/

function nameCheck(
   nameSToken: SToken | undefined,
   collector: Collector,
   confVer: ConformanceVersion,
   errorCode: string,
): void {
   if (!nameSToken || isName(nameSToken.str, confVer.version, confVer.edition)) {
      return;
   }

   collector.report(errorCode, [nameSToken.str], nameSToken);
}

export { nameCheck };
