/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { NotationDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { nameCheck } from './util/nameCheck';
import { externalIdCheck } from '../common/externalIdCheck';

import misc from '../../token/common/misc'; // ick

const WARN = XmlWarning.ID;
const WFEID = WellFormedError.ID;

function notationDeclarationCheck(
   pToken: NotationDeclarationPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   const nameText: string = strOrBlank(pToken.name);
   const declType = strOrBlank(pToken.declType);

   ec.setPos(pToken.open);

   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.NOTATIONDECL_OPEN_XTRA_SPACE_AFTER);

   ec.setPos(pToken.declType);
   ec.check(declType !== 'NOTATION', WFEID.NOTATIONDECL_DECLTYPE_INVALID, [declType]);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.NOTATIONDECL_NO_NAME);
   nameCheck(pToken.name, ec, confVer, WFEID.NOTATIONDECL_NAME_INVALID);
   misc.checkWellFormedNameRecommendation(
      pToken.name,
      ec,
      confVer,
      'NOTATION',
      WARN.NOTATIONDECL_NAME_XMLDASH_RESERVED,
      WARN.NOTATIONDECL_NAME_XML_RESERVED,
   );

   ec.setPos(pToken.nameSpace);
   ec.check(!pToken.nameSpace, WFEID.NOTATIONDECL_NAME_NO_SPACE, [nameText]);

   ec.check(!pToken.externalId, WFEID.NOTATIONDECL_NO_EXTERNALID);
   externalIdCheck(pToken.externalId, ec, confVer);

   ec.setPos(pToken.externalIdSpace);

   if (pToken.extra) {
      ec.setPos(pToken.extra);
      ec.report(WFEID.NOTATIONDECL_EXTRA_TEXT, [strOrBlank(pToken.extra)]);
   }

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.NOTATIONDECL_NO_CLOSE, [nameText]);
}

export { notationDeclarationCheck };
