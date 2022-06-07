/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { ElementDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { contentModelCheck } from '../common/contentModelCheck';
import { nameCheck } from '../common/nameCheck';
import { nameXmlCheck } from '../common/nameXmlCheck';
import { wellFormedErrorCodes } from '../error/wellFormedError';
import { warningCodes } from '../error/warningCodes';

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;
const ALLOWED_CONTENT_SPEC = ['EMPTY', 'ANY'];

function elementDeclarationCheck(
   pToken: ElementDeclarationPToken,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   const nameText = strOrBlank(pToken.name);
   const declType = strOrBlank(pToken.declType);

   collector.setPos(pToken.open);

   collector.setPos(pToken.openSpace);
   collector.check(pToken.openSpace, WFEID.ELEMENTDECL_OPEN_XTRA_SPACE_AFTER);

   collector.setPos(pToken.declType);
   collector.check(declType !== 'ELEMENT', WFEID.ELEMENTDECL_DECLTYPE_INVALID, [declType]);

   collector.setPos(pToken.declTypeSpace);
   collector.check(!pToken.declTypeSpace, WFEID.ELEMENTDECL_DECLTYPE_NO_SPACE);

   collector.setPos(pToken.name);
   collector.check(!pToken.name, WFEID.ELEMENTDECL_NO_NAME);
   nameCheck(pToken.name, collector, confVer, WFEID.ELEMENTDECL_NAME_INVALID);
   nameXmlCheck(
      pToken.name,
      collector,
      confVer,
      'ELEMENT',
      WID.ELEMENTDECL_NAME_XMLCOLON_RESERVED,
      WID.ELEMENTDECL_NAME_XML_RESERVED,
   );

   collector.setPos(pToken.nameSpace);
   collector.check(!pToken.nameSpace, WFEID.ELEMENTDECL_NAME_NO_SPACE, [nameText]);

   if (pToken.contentModel) {
      contentModelCheck(pToken.contentModel, collector, confVer, true);
   } else {
      const contentSpec: string = strOrBlank(pToken.contentSpec);
      const upperContentSpec = contentSpec.toLocaleUpperCase();
      collector.setPos(pToken.contentSpec);

      if (!pToken.contentSpec) {
         collector.report(WFEID.ELEMENTDECL_NO_SPEC, [nameText]);
      } else if (ALLOWED_CONTENT_SPEC.indexOf(upperContentSpec) === -1) {
         collector.report(WFEID.ELEMENTDECL_SPEC_UNKNOWN, [nameText, contentSpec]);
      } else if (contentSpec !== upperContentSpec) {
         collector.report(WFEID.ELEMENTDECL_SPEC_INVALID_CASE, [
            nameText,
            upperContentSpec,
            contentSpec,
         ]);
      }

      collector.setPos(pToken.contentSpecSpace);
   }

   if (pToken.extra) {
      collector.setPos(pToken.extra);
      collector.report(WFEID.ELEMENTDECL_EXTRA_TEXT, [strOrBlank(pToken.extra)]);
   }

   collector.setPos(pToken.close);
   collector.check(!pToken.close, WFEID.ELEMENTDECL_NO_CLOSE, [nameText]);
}

export { elementDeclarationCheck };
