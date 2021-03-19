/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { GeneralEntityReferencePToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { nameCheck } from '../common/nameCheck';
import { WellFormedError } from '../error/WellFormedError';

const WFEID = WellFormedError.ID;

function generalEntityReferenceCheck(
   pToken: GeneralEntityReferencePToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   const entityName = strOrBlank(pToken.name);

   ec.setPos(pToken.open);
   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.REFERENCE_XTRA_SPACE, [entityName]);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.REFERENCE_NO_NAME);

   if (pToken.name) {
      nameCheck(pToken.name, ec, confVer, WFEID.REFERENCE_NAME_INVALID);
   }

   ec.setPos(pToken.nameSpace);
   ec.check(pToken.nameSpace, WFEID.REFERENCE_XTRA_TRAILING_SPACE, [entityName]);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.REFERENCE_NO_SEMICOLON, [entityName]);
}

export { generalEntityReferenceCheck };
