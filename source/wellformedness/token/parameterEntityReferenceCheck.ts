/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { WellFormedError } from '../error/WellFormedError';
import { ParameterEntityReferencePToken } from 'pToken';
import { strOrBlank } from 'sToken';
import { nameCheck } from '../common/nameCheck';
const WFEID = WellFormedError.ID;

function parameterEntityReferenceCheck(
   pToken: ParameterEntityReferencePToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   const entityName = strOrBlank(pToken.name);

   ec.setPos(pToken.open);
   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.PEREF_XTRA_SPACE, [entityName]);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.PEREF_NO_NAME);

   if (pToken.name) {
      nameCheck(pToken.name, ec, confVer, WFEID.PEREF_NAME_INVALID);
   }

   ec.setPos(pToken.nameSpace);
   ec.check(pToken.nameSpace, WFEID.PEREF_XTRA_TRAILING_SPACE, [entityName]);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.PEREF_NO_SEMICOLON, [entityName]);
}

export { parameterEntityReferenceCheck };
