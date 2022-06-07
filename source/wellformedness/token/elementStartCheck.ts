/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { ElementEmptyPToken, ElementStartPToken } from 'token';

import { attributeCheck } from '../common/attributeCheck';
import { nameCheck } from '../common/nameCheck';
import { nameXmlCheck } from '../common/nameXmlCheck';
import { wellFormedErrorCodes } from '../error/wellFormedError';
import { warningCodes } from '../error/warningCodes';

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

function elementStartCheck(
   pToken: ElementStartPToken | ElementEmptyPToken,
   Collector: Collector,
   confVer: ConformanceVersion,
): void {
   Collector.setPos(pToken.openSpace);
   Collector.check(pToken.openSpace, WFEID.ELEMENT_XTRA_LEADING_SPACE);

   Collector.setPos(pToken.name);
   Collector.check(!pToken.name, WFEID.ELEMENT_NO_NAME);
   nameCheck(pToken.name, Collector, confVer, WFEID.ELEMENT_NAME_INVALID);
   nameXmlCheck(
      pToken.name,
      Collector,
      confVer,
      'ELEMENT',
      WID.ELEMENT_NAME_XMLCOLON_RESERVED,
      WID.ELEMENT_NAME_XML_RESERVED,
   );

   Collector.setPos(pToken.nameSpace);

   const attribs = pToken.attributes;
   attributeCheck(attribs, Collector, confVer, pToken.nameSpace, WFEID.NOUN_ATTRIBUTE);

   Collector.setPos(pToken.close);
   Collector.check(!pToken.close, WFEID.ELEMENT_NO_CLOSE);
}

export { elementStartCheck };
