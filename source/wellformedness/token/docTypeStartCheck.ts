/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { WellFormedError } from '../error/WellFormedError';

import { DocTypeStartPToken } from 'token';
import { nameCheck } from './util/nameCheck';
import { externalIdCheck } from '../common/externalIdCheck';

const WFEID = WellFormedError.ID;

function docTypeStartCheck(
   pToken: DocTypeStartPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   ec.setPos(pToken.open);

   ec.setPos(pToken.postOpenSpace);
   ec.check(pToken.postOpenSpace, WFEID.DECL_OPEN_XTRA_SPACE_AFTER);

   ec.setPos(pToken.declType);

   if (pToken.declType) {
      const upperCase = pToken.declType.str.toLocaleUpperCase();
      ec.check(pToken.declType.str !== upperCase, WFEID.DECL_DECLTYPE_INVALID_CASE, [
         upperCase,
         pToken.declType.str,
      ]);
   } else {
      ec.report(WFEID.DECL_NO_DECLTYPE);
   }

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.DOCTYPE_NO_NAME);
   nameCheck(pToken.name, ec, confVer, WFEID.DOCTYPE_NAME_INVALID);

   externalIdCheck(pToken.externalId, false, ec, confVer);

   ec.setPos(pToken.openSubset);
}

export { docTypeStartCheck };
