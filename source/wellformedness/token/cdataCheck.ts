/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { strOrBlank } from 'sToken';
import { CdataPToken } from 'token';

import { charCheck } from '../common/charCheck';
import { wellFormedErrorCodes } from '../error/wellFormedError';

const WFEID = wellFormedErrorCodes.id;

function cdataCheck(pToken: CdataPToken, collector: Collector, confVer: ConformanceVersion): void {
   const typeText = strOrBlank(pToken.sectionType);

   collector.setPos(pToken.open);

   collector.setPos(pToken.openSpace);
   collector.check(pToken.openSpace, WFEID.CDATA_XTRA_SPACE_AFTER_OPEN, [typeText]);

   collector.setPos(pToken.sectionType);

   if (pToken.sectionType) {
      const upperType = typeText.toLocaleUpperCase();

      collector.check(upperType !== 'CDATA', WFEID.CDATA_UNKNOWN, [typeText]);
      collector.check(typeText !== upperType, WFEID.CDATA_INVALID_CASE, [upperType, typeText]);
   } else {
      collector.report(WFEID.CDATA_NO_TYPE);
   }

   collector.setPos(pToken.sectionTypeSpace);

   collector.check(pToken.sectionTypeSpace, WFEID.CDATA_XTRA_SPACE_AFTER_TYPE, [typeText]);

   collector.setPos(pToken.bracket);
   collector.check(!pToken.bracket, WFEID.CDATA_NO_SECOND_BRACKET, [typeText]);

   collector.setPos(pToken.text);
   charCheck(pToken.text, collector, confVer, false);

   collector.setPos(pToken.close);
   collector.check(!pToken.close, WFEID.CDATA_NO_CLOSE);
}

export { cdataCheck };
