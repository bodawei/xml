/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { ElementEndPToken } from 'token';

import { nameCheck } from '../common/nameCheck';
import { nameXmlCheck } from '../common/nameXmlCheck';
import { wellFormedErrorCodes } from '../error/wellFormedError';
import { warningCodes } from '../error/warningCodes';

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

function elementEndCheck(
   pToken: ElementEndPToken,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   collector.setPos(pToken.openSpace);
   collector.check(pToken.openSpace, WFEID.ELEMENT_XTRA_LEADING_SPACE);

   collector.setPos(pToken.name);
   collector.check(!pToken.name, WFEID.ELEMENT_NO_NAME);
   nameCheck(pToken.name, collector, confVer, WFEID.ELEMENT_NAME_INVALID);
   nameXmlCheck(
      pToken.name,
      collector,
      confVer,
      'ELEMENT',
      WID.ELEMENT_NAME_XMLCOLON_RESERVED,
      WID.ELEMENT_NAME_XML_RESERVED,
   );

   collector.setPos(pToken.nameSpace);

   collector.setPos(pToken.close);
   collector.check(!pToken.close, WFEID.ELEMENT_NO_CLOSE);
}

export { elementEndCheck };
