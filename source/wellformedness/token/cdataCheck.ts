/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { strOrBlank } from 'sToken';
import { CdataPToken } from 'token';

import { WellFormedError } from '../error/WellFormedError';
import { checkCharWellFormed } from '../../token/common/misc';

const WFEID = WellFormedError.ID;

function cdataCheck(pToken: CdataPToken, ec: ErrorCollector, confVer: ConformanceVersion): void {
   const typeText = strOrBlank(pToken.sectionType);

   ec.setPos(pToken.open);

   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.CDATA_XTRA_SPACE_AFTER_OPEN, [typeText]);

   ec.setPos(pToken.sectionType);

   if (pToken.sectionType) {
      const upperType = typeText.toLocaleUpperCase();

      ec.check(upperType !== 'CDATA', WFEID.CDATA_UNKNOWN, [typeText]);
      ec.check(typeText !== upperType, WFEID.CDATA_INVALID_CASE, [upperType, typeText]);
   } else {
      ec.report(WFEID.CDATA_NO_TYPE);
   }

   ec.setPos(pToken.sectionTypeSpace);

   ec.check(pToken.sectionTypeSpace, WFEID.CDATA_XTRA_SPACE_AFTER_TYPE, [typeText]);

   ec.setPos(pToken.bracket);
   ec.check(!pToken.bracket, WFEID.CDATA_NO_SECOND_BRACKET, [typeText]);

   ec.setPos(pToken.text);
   checkCharWellFormed(pToken.text, ec, confVer);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.CDATA_NO_CLOSE);
}

export { cdataCheck };
