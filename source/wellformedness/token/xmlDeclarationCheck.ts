/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { InstructionField, XmlDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';
import { fatalError } from '../error/fatalError';

import { charCheck } from '../common/charCheck';
import { checkSpaceProblems, checkSpaces, checkVersionString } from '../common/xmlTextDeclUtils';
import { WellFormedError } from '../error/WellFormedError';

const WFEID = WellFormedError.ID;
const ENCODING_REGEXP = /^[A-Za-z][-A-Za-z0-9._]*$/;
const PARAM_NAMES = ['version', 'encoding', 'standalone'];

function checkFields(
   params: ReadonlyArray<InstructionField>,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   let foundVersion = false;
   let foundEncoding = false;
   let foundStandalone = false;
   let prevParam;

   for (const param of params) {
      const nameText = strOrBlank(param.name);
      const lcName = nameText.toLowerCase();
      const value = param.value;
      const valueText = strOrBlank(value);
      const lcValue = valueText.toLowerCase();

      ec.setPos(param.name);

      if (PARAM_NAMES.indexOf(lcName) !== -1) {
         ec.check(nameText !== lcName, WFEID.XMLDECL_PARAM_INVALID_CASE, [lcName, nameText]);
      }

      if (prevParam) {
         ec.check(!prevParam.valueSpace, WFEID.XMLDECL_NO_SPACE_BETWEEN_PARAMS, [nameText]);
      }

      switch (lcName) {
         case 'version':
            ec.check(foundVersion, WFEID.XMLDECL_DUPLICATE_VERSION);
            foundVersion = true;
            ec.check(foundEncoding || foundStandalone, WFEID.XMLDECL_VERSION_INVALID_ORDER);

            checkSpaces(param, fatalError.id.XMLDECL_INVALID_SPACE, undefined, ec, confVer);
            ec.setPos(value);
            charCheck(value, ec, confVer, false);

            checkVersionString(valueText, true, ec, confVer);
            break;
         case 'encoding':
            ec.check(foundEncoding, WFEID.XMLDECL_DUPLICATE_ENCODING);
            foundEncoding = true;
            ec.check(!foundVersion || foundStandalone, WFEID.XMLDECL_ENCODING_INVALID_ORDER);

            checkSpaces(
               param,
               fatalError.id.XMLDECL_INVALID_SPACE,
               WFEID.XMLDECL_ENCODING_NO_EQUAL,
               ec,
               confVer,
            );
            ec.setPos(value);
            charCheck(value, ec, confVer, false);
            ec.check(!ENCODING_REGEXP.exec(valueText), WFEID.XMLDECL_ENCODING_INVALID, [valueText]);
            break;
         case 'standalone':
            ec.check(foundStandalone, WFEID.XMLDECL_DUPLICATE_STANDALONE);
            foundStandalone = true;
            ec.check(!foundVersion, WFEID.XMLDECL_STANDALONE_INVALID_ORDER);

            checkSpaces(param, fatalError.id.XMLDECL_INVALID_SPACE, undefined, ec, confVer);
            ec.setPos(value);
            charCheck(value, ec, confVer, false);
            ec.check(lcValue !== 'no' && lcValue !== 'yes', WFEID.XMLDECL_STANDALONE_INVALID, [
               valueText,
            ]);
            ec.check(valueText !== lcValue, WFEID.XMLDECL_STANDALONE_INVALID_CASE, [
               lcValue,
               valueText,
            ]);
            break;
         default:
            ec.report(WFEID.XMLDECL_PARAM_UNKNOWN, [nameText]);
      }

      prevParam = param;

      ec.setPos(param.valueSpace);

      checkSpaceProblems(param.valueSpace, fatalError.id.XMLDECL_INVALID_SPACE, ec, confVer);
   }

   // No need to test if version was found. Either have encoding or standalone (error) or no params.
   ec.check(params.length === 0, WFEID.XMLDECL_NO_PARAMS);
}

function xmlDeclarationCheck(
   pToken: XmlDeclarationPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   ec.setPos(pToken.open);
   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.XMLDECL_SPACE_AFTER_OPEN);
   checkSpaceProblems(pToken.openSpace, fatalError.id.XMLDECL_INVALID_SPACE, ec, confVer);

   ec.setPos(pToken.target);
   charCheck(pToken.target, ec, confVer, false);
   if (pToken.target) {
      const target = strOrBlank(pToken.target);
      const lcTarget = target.toLowerCase();
      ec.check(target !== lcTarget, WFEID.XMLDECL_TARGET_INVALID_CASE, [pToken.target.str]);
   } else {
      ec.report(WFEID.XMLDECL_NO_TARGET);
   }

   ec.setPos(pToken.targetSpace);
   ec.check(!pToken.targetSpace, WFEID.XMLDECL_NO_SPACE_AFTER_TARGET);
   checkSpaceProblems(pToken.targetSpace, fatalError.id.XMLDECL_INVALID_SPACE, ec, confVer);

   checkFields(pToken.fields, ec, confVer);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.XMLDECL_NO_CLOSE);
}

export { xmlDeclarationCheck };
