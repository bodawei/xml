/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, XmlWarning } from 'basic';
import { WellFormedError } from '../error/WellFormedError';
import { nameCheck } from './util/nameCheck';

import { ElementEmptyPToken, ElementStartPToken } from 'token';
import misc from '../../token/common/misc';
import attribute from '../../token/common/attribute';

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
   misc.checkWellFormedNameRecommendation(
      pToken.name,
      ec,
      confVer,
      'ELEMENT',
      WARN.ELEMENT_NAME_XMLCOLON_RESERVED,
      WARN.ELEMENT_NAME_XML_RESERVED,
   );

   ec.setPos(pToken.nameSpace);

   const attribs = pToken.attributes;
   attribute.checkWellFormed(attribs, ec, confVer, pToken.nameSpace, WFEID.NOUN_ATTRIBUTE);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.ELEMENT_NO_CLOSE);
}

export { elementStartCheck };
