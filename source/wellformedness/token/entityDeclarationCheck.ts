/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, isName } from 'basic';
import {
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
   TEXT_PTOKEN,
} from 'pToken';
import { strOrBlank } from 'sToken';
import { LiteralValuePToken } from 'token';

import { charCheck } from '../common/charCheck';
import { externalIdCheck } from '../common/externalIdCheck';
import { literalCheck } from '../common/literalCheck';
import { nameCheck } from '../common/nameCheck';
import { nameXmlCheck } from '../common/nameXmlCheck';
import { WellFormedError } from '../error/WellFormedError';
import { wellFormedWarningCodes } from '../error/wellFormedWarningCodes';

const WFEID = WellFormedError.ID;
const WARN = wellFormedWarningCodes.id;
const POSSIBLE_GEREF_REGEXP = /&([^;]*);/g;

function isParameterEntityDeclaration(
   pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
): pToken is ParameterEntityDeclarationPToken {
   return 'parameter' in pToken;
}

function checkAmpersands(value: LiteralValuePToken, ec: ErrorCollector): void {
   for (const element of value) {
      if (element.type !== TEXT_PTOKEN) {
         continue;
      }

      const contents = strOrBlank(element.text);
      let ampIndex = contents.indexOf('&');

      while (ampIndex !== -1) {
         POSSIBLE_GEREF_REGEXP.lastIndex = ampIndex;
         const match = POSSIBLE_GEREF_REGEXP.exec(contents);

         if (!match) {
            ec.report(
               WellFormedError.ID.REFERENCE_INVALID_CHARS,
               [contents.substr(ampIndex, 10)],
               element.text,
            );
         } else {
            const possibleName = match[1];

            if (!isName(possibleName)) {
               ec.report(WellFormedError.ID.REFERENCE_INVALID_SYNTAX, [match[0]], element.text);
            }
         }

         ampIndex = contents.indexOf('&', ampIndex + 1);
      }
   }
}

function entityDeclarationCheck(
   pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   const enNameText = strOrBlank(pToken.name);
   const declType = strOrBlank(pToken.declType);

   ec.setPos(pToken.open);

   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.ENTITYDECL_OPEN_XTRA_SPACE_AFTER);

   ec.setPos(pToken.declType);
   ec.check(declType !== 'ENTITY', WFEID.ENTITYDECL_DECLTYPE_INVALID, [declType]);

   ec.setPos(pToken.declTypeSpace);
   ec.check(!pToken.declTypeSpace, WFEID.ENTITYDECL_DECLTYPE_NO_SPACE_AFTER, [declType]);

   if (isParameterEntityDeclaration(pToken)) {
      ec.setPos(pToken.parameter);
      ec.setPos(pToken.parameterSpace);
      ec.check(!pToken.parameterSpace, WFEID.ENTITYDECL_PERCENT_NO_TRAILING_SPACE, [enNameText]);
   }

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.ENTITYDECL_NO_NAME);
   nameCheck(pToken.name, ec, confVer, WFEID.ENTITYDECL_NAME_INVALID);
   nameXmlCheck(
      pToken.name,
      ec,
      confVer,
      'ENTITY',
      WARN.ENTITYDECL_NAME_XMLDASH_RESERVED,
      WARN.ENTITYDECL_NAME_XML_RESERVED,
   );
   ec.setPos(pToken.nameSpace);
   ec.check(!pToken.nameSpace, WFEID.ENTITYDECL_NAME_NO_TRAILING_SPACE, [enNameText]);

   if (pToken.externalId) {
      externalIdCheck(pToken.externalId, false, ec, confVer);

      if (pToken.type === GENERAL_ENTITY_DECLARATION_PTOKEN && pToken.nData) {
         ec.setPos(pToken.externalIdSpace);
         ec.check(!pToken.externalIdSpace, WFEID.ENTITYDECL_EXTERNALID_NO_SPACE, [enNameText]);

         ec.setPos(pToken.nData);
         ec.check(pToken.nData.str !== 'NDATA', WFEID.ENTITYDECL_NDATA_INVALID_CASE, [
            enNameText,
            pToken.nData.str,
         ]);
         ec.setPos(pToken.nDataName);
         ec.check(!pToken.nDataName, WFEID.ENTITYDECL_NDATA_NO_NAME, [enNameText]);
         charCheck(pToken.nDataName, ec, confVer, false);
      }
   } else {
      literalCheck(pToken, ec, confVer, WFEID.NOUN_ENTITYVALUE);
      checkAmpersands(pToken.value, ec);
   }

   if (pToken.extra) {
      ec.setPos(pToken.extra);
      ec.report(WFEID.ENTITYDECL_EXTRA_TEXT, [strOrBlank(pToken.extra)]);
   }

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.ENTITYDECL_NO_CLOSE, [enNameText]);
}

export { entityDeclarationCheck };
