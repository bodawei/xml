/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { WellFormedError, XmlWarning } from 'error';
import { strOrBlank } from 'sToken';
import {
   GeneralEntityDeclarationPToken,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
} from '../../pToken/token/GeneralEntityDeclaration';
import { ParameterEntityDeclarationPToken } from '../../pToken/token/parameterEntityDeclaration';

import { nameCheck } from './util/nameCheck';
import { externalIdCheck } from '../common/externalIdCheck';

// ick
import literal from '../../token/common/literal';
import * as misc from '../../token/common/misc';

const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;

function isParameterEntityDeclaration(
   pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
): pToken is ParameterEntityDeclarationPToken {
   return 'parameter' in pToken;
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
   misc.checkWellFormedNameRecommendation(
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
      externalIdCheck(pToken.externalId, ec, confVer);

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
         misc.checkCharWellFormed(pToken.nDataName, ec, confVer);
      }
   } else {
      literal.checkWellFormed(pToken, ec, confVer, WFEID.NOUN_ENTITYVALUE);
   }

   if (pToken.extra) {
      ec.setPos(pToken.extra);
      ec.report(WFEID.ENTITYDECL_EXTRA_TEXT, [strOrBlank(pToken.extra)]);
   }

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.ENTITYDECL_NO_CLOSE, [enNameText]);
}

export { entityDeclarationCheck };
