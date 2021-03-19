/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, XmlWarning } from 'basic';
import { ElementEmptyPToken, ElementStartPToken } from 'token';

import { attributeCheck } from '../common/attributeCheck';
import { nameCheck } from '../common/nameCheck';
import { nameXmlCheck } from '../common/nameXmlCheck';
import { WellFormedError } from '../error/WellFormedError';

const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;

function elementStartCheck(
   pToken: ElementStartPToken | ElementEmptyPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.ELEMENT_XTRA_LEADING_SPACE);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.ELEMENT_NO_NAME);
   nameCheck(pToken.name, ec, confVer, WFEID.ELEMENT_NAME_INVALID);
   nameXmlCheck(
      pToken.name,
      ec,
      confVer,
      'ELEMENT',
      WARN.ELEMENT_NAME_XMLCOLON_RESERVED,
      WARN.ELEMENT_NAME_XML_RESERVED,
   );

   ec.setPos(pToken.nameSpace);

   const attribs = pToken.attributes;
   attributeCheck(attribs, ec, confVer, pToken.nameSpace, WFEID.NOUN_ATTRIBUTE);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.ELEMENT_NO_CLOSE);
}

export { elementStartCheck };
