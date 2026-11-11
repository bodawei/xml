/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { DocTypeStartPToken } from 'token';

import { externalIdCheck } from '../common/externalIdCheck';
import { nameCheck } from '../common/nameCheck';
import { wellFormedErrorCodes } from '../error/wellFormedError';

const WFEID = wellFormedErrorCodes.id;

function docTypeStartCheck(
   pToken: DocTypeStartPToken,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   collector.setPos(pToken.open);

   collector.setPos(pToken.postOpenSpace);
   collector.check(pToken.postOpenSpace, WFEID.DECL_OPEN_XTRA_SPACE_AFTER);

   collector.setPos(pToken.declType);

   if (pToken.declType) {
      const upperCase = pToken.declType.str.toLocaleUpperCase();
      collector.check(pToken.declType.str !== upperCase, WFEID.DECL_DECLTYPE_INVALID_CASE, [
         upperCase,
         pToken.declType.str,
      ]);
   } else {
      collector.report(WFEID.DECL_NO_DECLTYPE);
   }

   collector.setPos(pToken.name);
   collector.check(!pToken.name, WFEID.DOCTYPE_NO_NAME);
   nameCheck(pToken.name, collector, confVer, WFEID.DOCTYPE_NAME_INVALID);

   externalIdCheck(pToken.externalId, false, collector, confVer);

   collector.setPos(pToken.openSubset);
}

export { docTypeStartCheck };
