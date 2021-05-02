/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, fatalError } from 'basic';
import { InstructionField, TextDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { charCheck } from '../common/charCheck';
import { checkSpaceProblems, checkSpaces, checkVersionString } from '../common/xmlTextDeclUtils';
import { WellFormedError } from '../error/WellFormedError';

const WFEID = WellFormedError.ID;
const ENCODING_REGEXP = /^[A-Za-z][-A-Za-z0-9._]*$/;

function checkFields(
   params: ReadonlyArray<InstructionField>,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   let foundEncoding = false;
   let foundVersion = false;

   for (const param of params) {
      const nameText = strOrBlank(param.name);
      const lcName = nameText.toLowerCase();
      const value = param.value;
      const valueText = strOrBlank(value);

      ec.setPos(param.name);
      ec.check(nameText !== lcName, WFEID.TEXTDECL_PARAM_INVALID_CASE, [lcName, nameText]);

      switch (lcName) {
         case 'version':
            ec.check(foundVersion, WFEID.TEXTDECL_DUPLICATE_VERSION);
            foundVersion = true;
            ec.check(foundEncoding, WFEID.TEXTDECL_VERSION_INVALID_ORDER);

            checkSpaces(param, fatalError.id.TEXTDECL_INVALID_SPACE, undefined, ec, confVer);
            ec.setPos(value);
            charCheck(value, ec, confVer, false);

            checkVersionString(valueText, false, ec, confVer);
            break;
         case 'encoding':
            ec.check(foundEncoding, WFEID.TEXTDECL_DUPLICATE_ENCODING);
            foundEncoding = true;

            checkSpaces(param, fatalError.id.TEXTDECL_INVALID_SPACE, undefined, ec, confVer);
            ec.setPos(value);
            charCheck(value, ec, confVer, false);
            ec.check(!ENCODING_REGEXP.test(valueText), WFEID.TEXTDECL_ENCODING_INVALID, [
               valueText,
            ]);
            break;
      }

      ec.setPos(param.valueSpace);
      checkSpaceProblems(param.valueSpace, fatalError.id.TEXTDECL_INVALID_SPACE, ec, confVer);
   }

   ec.check(!foundEncoding, WFEID.TEXTDECL_ENCODING_MISSING);
}

function textDeclarationCheck(
   pToken: TextDeclarationPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   ec.setPos(pToken.open);
   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.TEXTDECL_SPACE_AFTER_OPEN);
   checkSpaceProblems(pToken.openSpace, fatalError.id.TEXTDECL_INVALID_SPACE, ec, confVer);

   ec.setPos(pToken.target);
   charCheck(pToken.target, ec, confVer, false);

   if (pToken.target) {
      const target = strOrBlank(pToken.target);
      const lcTarget = target.toLowerCase();
      ec.check(target !== lcTarget, WFEID.TEXTDECL_TARGET_INVALID_CASE, [pToken.target.str]);
   } else {
      ec.report(WFEID.TEXTDECL_NO_TARGET);
   }

   ec.setPos(pToken.targetSpace);
   ec.check(!pToken.targetSpace, WFEID.TEXTDECL_NO_SPACE_AFTER_TARGET);
   checkSpaceProblems(pToken.targetSpace, fatalError.id.TEXTDECL_INVALID_SPACE, ec, confVer);

   checkFields(pToken.fields, ec, confVer);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.TEXTDECL_NO_CLOSE);
}

export { textDeclarationCheck };
