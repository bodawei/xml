/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { EntityMetaData, isName } from 'basic';
import { ErrorCollector } from 'error';
import { SToken } from 'sToken';

/**********************************************************************\
 checkName() validates that the specified SToken matches the basic
 character requirements for names.
\**********************************************************************/

function nameCheck(
   nameSToken: SToken | void,
   ec: ErrorCollector,
   entityMetaData: EntityMetaData,
   errorCode: string,
): void {
   if (!nameSToken || isName(nameSToken.str, entityMetaData.version, entityMetaData.revision)) {
      return;
   }

   ec.report(errorCode, [nameSToken.str], nameSToken);
}

export { nameCheck };
