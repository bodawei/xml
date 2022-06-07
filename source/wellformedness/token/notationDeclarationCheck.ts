/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { NotationDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { nameCheck } from '../common/nameCheck';
import { nameXmlCheck } from '../common/nameXmlCheck';
import { externalIdCheck } from '../common/externalIdCheck';
import { wellFormedErrorCodes } from '../error/wellFormedError';
import { warningCodes } from '../error/warningCodes';

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

function notationDeclarationCheck(
   pToken: NotationDeclarationPToken,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   const nameText: string = strOrBlank(pToken.name);
   const declType = strOrBlank(pToken.declType);

   collector.setPos(pToken.open);

   collector.setPos(pToken.openSpace);
   collector.check(pToken.openSpace, WFEID.NOTATIONDECL_OPEN_XTRA_SPACE_AFTER);

   collector.setPos(pToken.declType);
   collector.check(declType !== 'NOTATION', WFEID.NOTATIONDECL_DECLTYPE_INVALID, [declType]);

   collector.setPos(pToken.name);
   collector.check(!pToken.name, WFEID.NOTATIONDECL_NO_NAME);
   nameCheck(pToken.name, collector, confVer, WFEID.NOTATIONDECL_NAME_INVALID);
   nameXmlCheck(
      pToken.name,
      collector,
      confVer,
      'NOTATION',
      WID.NOTATIONDECL_NAME_XMLDASH_RESERVED,
      WID.NOTATIONDECL_NAME_XML_RESERVED,
   );

   collector.setPos(pToken.nameSpace);
   collector.check(!pToken.nameSpace, WFEID.NOTATIONDECL_NAME_NO_SPACE, [nameText]);

   collector.check(!pToken.externalId, WFEID.NOTATIONDECL_NO_EXTERNALID);
   externalIdCheck(pToken.externalId, true, collector, confVer);

   collector.setPos(pToken.externalIdSpace);

   if (pToken.extra) {
      collector.setPos(pToken.extra);
      collector.report(WFEID.NOTATIONDECL_EXTRA_TEXT, [strOrBlank(pToken.extra)]);
   }

   collector.setPos(pToken.close);
   collector.check(!pToken.close, WFEID.NOTATIONDECL_NO_CLOSE, [nameText]);
}

export { notationDeclarationCheck };
