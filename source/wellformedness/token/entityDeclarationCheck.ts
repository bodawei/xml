/* Copyright ® 2016-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector, isName } from 'basic';
import { strOrBlank } from 'basic';
import {
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
   TEXT_PTOKEN,
} from 'pToken';
import { LiteralValuePToken } from 'token';

import { charCheck } from '../common/charCheck';
import { externalIdCheck } from '../common/externalIdCheck';
import { literalCheck } from '../common/literalCheck';
import { nameCheck } from '../common/nameCheck';
import { nameXmlCheck } from '../common/nameXmlCheck';
import { warningCodes } from '../error/warningCodes';
import { wellFormedErrorCodes } from '../error/wellFormedError';

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;
const POSSIBLE_GEREF_REGEXP = /&([^;]*);/g;

function isParameterEntityDeclaration(
   pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
): pToken is ParameterEntityDeclarationPToken {
   return 'parameter' in pToken;
}

function checkAmpersands(value: LiteralValuePToken, collector: Collector): void {
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
            collector.report(
               WFEID.REFERENCE_INVALID_CHARS,
               [contents.slice(ampIndex, ampIndex + 10)],
               element.text,
            );
         } else {
            const possibleName = match[1];

            if (!isName(possibleName)) {
               collector.report(WFEID.REFERENCE_INVALID_SYNTAX, [match[0]], element.text);
            }
         }

         ampIndex = contents.indexOf('&', ampIndex + 1);
      }
   }
}

function entityDeclarationCheck(
   pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   const enNameText = strOrBlank(pToken.name);
   const declType = strOrBlank(pToken.declType);

   collector.setPos(pToken.open);

   collector.setPos(pToken.openSpace);
   collector.check(pToken.openSpace, WFEID.ENTITYDECL_OPEN_XTRA_SPACE_AFTER);

   collector.setPos(pToken.declType);
   collector.check(declType !== 'ENTITY', WFEID.ENTITYDECL_DECLTYPE_INVALID, [declType]);

   collector.setPos(pToken.declTypeSpace);
   collector.check(!pToken.declTypeSpace, WFEID.ENTITYDECL_DECLTYPE_NO_SPACE_AFTER, [declType]);

   if (isParameterEntityDeclaration(pToken)) {
      collector.setPos(pToken.parameter);
      collector.setPos(pToken.parameterSpace);
      collector.check(!pToken.parameterSpace, WFEID.ENTITYDECL_PERCENT_NO_TRAILING_SPACE, [
         enNameText,
      ]);
   }

   collector.setPos(pToken.name);
   collector.check(!pToken.name, WFEID.ENTITYDECL_NO_NAME);
   nameCheck(pToken.name, collector, confVer, WFEID.ENTITYDECL_NAME_INVALID);
   nameXmlCheck(
      pToken.name,
      collector,
      confVer,
      'ENTITY',
      WID.ENTITYDECL_NAME_XMLDASH_RESERVED,
      WID.ENTITYDECL_NAME_XML_RESERVED,
   );
   collector.setPos(pToken.nameSpace);
   collector.check(!pToken.nameSpace, WFEID.ENTITYDECL_NAME_NO_TRAILING_SPACE, [enNameText]);

   if (pToken.externalId) {
      externalIdCheck(pToken.externalId, false, collector, confVer);

      if (pToken.type === GENERAL_ENTITY_DECLARATION_PTOKEN && pToken.nData) {
         collector.setPos(pToken.externalIdSpace);
         collector.check(!pToken.externalIdSpace, WFEID.ENTITYDECL_EXTERNALID_NO_SPACE, [
            enNameText,
         ]);

         collector.setPos(pToken.nData);
         collector.check(pToken.nData.str !== 'NDATA', WFEID.ENTITYDECL_NDATA_INVALID_CASE, [
            enNameText,
            pToken.nData.str,
         ]);
         collector.setPos(pToken.nDataName);
         collector.check(!pToken.nDataName, WFEID.ENTITYDECL_NDATA_NO_NAME, [enNameText]);
         charCheck(pToken.nDataName, collector, confVer, false);
      }
   } else {
      literalCheck(pToken, collector, confVer, WFEID.NOUN_ENTITYVALUE);
      checkAmpersands(pToken.value, collector);
   }

   if (pToken.extra) {
      collector.setPos(pToken.extra);
      collector.report(WFEID.ENTITYDECL_EXTRA_TEXT, [strOrBlank(pToken.extra)]);
   }

   collector.setPos(pToken.close);
   collector.check(!pToken.close, WFEID.ENTITYDECL_NO_CLOSE, [enNameText]);
}

export { entityDeclarationCheck };
