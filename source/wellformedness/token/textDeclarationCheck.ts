/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { WellFormedError, ErrorCollector } from 'error';
import { TextDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { checkCharWellFormed } from '../../token/common/misc';
import { EntityInstructionParam } from '../../token/common/entityInstruction';

const WFEID = WellFormedError.ID;
const ENCODING_REGEXP = /^[A-Za-z][-A-Za-z0-9._]*$/;

function checkParameters(
   params: ReadonlyArray<EntityInstructionParam>,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   let foundEncoding = false;

   for (const param of params) {
      const nameText = strOrBlank(param.name);
      const lcName = nameText.toLowerCase();
      const value = param.value;
      const valueText = strOrBlank(value);

      ec.setPos(param.name);
      ec.check(nameText !== lcName, WFEID.TEXTDECL_PARAM_INVALID_CASE, [lcName, nameText]);

      switch (lcName) {
         case 'version':
            ec.check(foundEncoding, WFEID.TEXTDECL_VERSION_INVALID_ORDER);

            ec.setPos(param.nameSpace);
            ec.setPos(param.equal);
            ec.setPos(param.equalSpace);
            ec.setPos(param.openQuote);
            ec.setPos(value);
            checkCharWellFormed(value, ec, confVer);
            ec.check(valueText !== '1.1' && valueText !== '1.0', WFEID.TEXTDECL_VERSION_INVALD, [
               valueText,
            ]);
            break;
         case 'encoding':
            foundEncoding = true;

            ec.setPos(param.nameSpace);
            ec.setPos(param.equal);
            ec.setPos(param.equalSpace);
            ec.setPos(param.openQuote);
            ec.setPos(value);
            checkCharWellFormed(value, ec, confVer);
            ec.check(!valueText.match(ENCODING_REGEXP), WFEID.TEXTDECL_ENCODING_INVALID, [
               valueText,
            ]);
            break;
      }
   }
}

function textDeclarationCheck(
   pToken: TextDeclarationPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   ec.setPos(pToken.open);
   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.TEXTDECL_SPACE_AFTER_OPEN);

   ec.setPos(pToken.target);
   checkCharWellFormed(pToken.target, ec, confVer);

   if (pToken.target) {
      const target = strOrBlank(pToken.target);
      const lcTarget = target.toLowerCase();
      ec.check(target !== lcTarget, WFEID.TEXTDECL_TARGET_INVALID_CASE, [pToken.target.str]);
   } else {
      ec.report(WFEID.TEXTDECL_NO_TARGET);
   }

   ec.setPos(pToken.targetSpace);
   ec.check(!pToken.targetSpace, WFEID.TEXTDECL_NO_SPACE_AFTER_TARGET);

   checkParameters(pToken.params, ec, confVer);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.TEXTDECL_NO_CLOSE);
}

export { textDeclarationCheck };
