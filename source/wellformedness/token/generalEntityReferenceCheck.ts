/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { strOrBlank } from 'basic';
import { GeneralEntityReferencePToken } from 'pToken';

import { nameCheck } from '../common/nameCheck';
import { wellFormedErrorCodes } from '../error/wellFormedError';

const WFEID = wellFormedErrorCodes.id;

function generalEntityReferenceCheck(
   pToken: GeneralEntityReferencePToken,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   const entityName = strOrBlank(pToken.name);

   collector.setPos(pToken.open);
   collector.setPos(pToken.openSpace);
   collector.check(pToken.openSpace, WFEID.REFERENCE_XTRA_SPACE, [entityName]);

   collector.setPos(pToken.name);
   collector.check(!pToken.name, WFEID.REFERENCE_NO_NAME);

   if (pToken.name) {
      nameCheck(pToken.name, collector, confVer, WFEID.REFERENCE_NAME_INVALID);
   }

   collector.setPos(pToken.nameSpace);
   collector.check(pToken.nameSpace, WFEID.REFERENCE_XTRA_TRAILING_SPACE, [entityName]);

   collector.setPos(pToken.close);
   collector.check(!pToken.close, WFEID.REFERENCE_NO_SEMICOLON, [entityName]);
}

export { generalEntityReferenceCheck };
