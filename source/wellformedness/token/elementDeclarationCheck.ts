/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, warning } from 'basic';
import { ElementDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { contentModelCheck } from '../common/contentModelCheck';
import { nameCheck } from '../common/nameCheck';
import { nameXmlCheck } from '../common/nameXmlCheck';
import { WellFormedError } from '../error/WellFormedError';

const WFEID = WellFormedError.ID;
const WARN = warning.id;
const ALLOWED_CONTENT_SPEC = ['EMPTY', 'ANY'];

function elementDeclarationCheck(
   pToken: ElementDeclarationPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   const nameText = strOrBlank(pToken.name);
   const declType = strOrBlank(pToken.declType);

   ec.setPos(pToken.open);

   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.ELEMENTDECL_OPEN_XTRA_SPACE_AFTER);

   ec.setPos(pToken.declType);
   ec.check(declType !== 'ELEMENT', WFEID.ELEMENTDECL_DECLTYPE_INVALID, [declType]);

   ec.setPos(pToken.declTypeSpace);
   ec.check(!pToken.declTypeSpace, WFEID.ELEMENTDECL_DECLTYPE_NO_SPACE);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.ELEMENTDECL_NO_NAME);
   nameCheck(pToken.name, ec, confVer, WFEID.ELEMENTDECL_NAME_INVALID);
   nameXmlCheck(
      pToken.name,
      ec,
      confVer,
      'ELEMENT',
      WARN.ELEMENTDECL_NAME_XMLCOLON_RESERVED,
      WARN.ELEMENTDECL_NAME_XML_RESERVED,
   );

   ec.setPos(pToken.nameSpace);
   ec.check(!pToken.nameSpace, WFEID.ELEMENTDECL_NAME_NO_SPACE, [nameText]);

   if (pToken.contentModel) {
      contentModelCheck(pToken.contentModel, ec, confVer, true);
   } else {
      const contentSpec: string = strOrBlank(pToken.contentSpec);
      const upperContentSpec = contentSpec.toLocaleUpperCase();
      ec.setPos(pToken.contentSpec);

      if (!pToken.contentSpec) {
         ec.report(WFEID.ELEMENTDECL_NO_SPEC, [nameText]);
      } else if (ALLOWED_CONTENT_SPEC.indexOf(upperContentSpec) === -1) {
         ec.report(WFEID.ELEMENTDECL_SPEC_UNKNOWN, [nameText, contentSpec]);
      } else if (contentSpec !== upperContentSpec) {
         ec.report(WFEID.ELEMENTDECL_SPEC_INVALID_CASE, [nameText, upperContentSpec, contentSpec]);
      }

      ec.setPos(pToken.contentSpecSpace);
   }

   if (pToken.extra) {
      ec.setPos(pToken.extra);
      ec.report(WFEID.ELEMENTDECL_EXTRA_TEXT, [strOrBlank(pToken.extra)]);
   }

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.ELEMENTDECL_NO_CLOSE, [nameText]);
}

export { elementDeclarationCheck };
