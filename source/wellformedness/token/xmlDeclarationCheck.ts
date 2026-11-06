/* Copyright ® 2016-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { InstructionField, XmlDeclarationPToken } from 'pToken';
import { strOrBlank } from 'basic';
import { fatalErrorCodes } from '../error/fatalErrorCodes';

import { charCheck } from '../common/charCheck';
import { checkSpaceProblems, checkSpaces, checkVersionString } from '../common/xmlTextDeclUtils';
import { wellFormedErrorCodes } from '../error/wellFormedError';

const FEID = fatalErrorCodes.id;
const WFEID = wellFormedErrorCodes.id;
const ENCODING_REGEXP = /^[A-Za-z][-A-Za-z0-9._]*$/;
const PARAM_NAMES = ['version', 'encoding', 'standalone'];

function checkFields(
   params: ReadonlyArray<InstructionField>,
   collector: Collector,
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

      collector.setPos(param.name);

      if (PARAM_NAMES.includes(lcName)) {
         collector.check(nameText !== lcName, WFEID.XMLDECL_PARAM_INVALID_CASE, [lcName, nameText]);
      }

      if (prevParam) {
         collector.check(!prevParam.valueSpace, WFEID.XMLDECL_NO_SPACE_BETWEEN_PARAMS, [nameText]);
      }

      switch (lcName) {
         case 'version':
            collector.check(foundVersion, WFEID.XMLDECL_DUPLICATE_VERSION);
            foundVersion = true;
            collector.check(foundEncoding || foundStandalone, WFEID.XMLDECL_VERSION_INVALID_ORDER);

            checkSpaces(param, FEID.XMLDECL_INVALID_SPACE, undefined, collector, confVer);
            collector.setPos(value);
            charCheck(value, collector, confVer, false);

            checkVersionString(valueText, true, collector, confVer);
            break;
         case 'encoding':
            collector.check(foundEncoding, WFEID.XMLDECL_DUPLICATE_ENCODING);
            foundEncoding = true;
            collector.check(!foundVersion || foundStandalone, WFEID.XMLDECL_ENCODING_INVALID_ORDER);

            checkSpaces(
               param,
               FEID.XMLDECL_INVALID_SPACE,
               WFEID.XMLDECL_ENCODING_NO_EQUAL,
               collector,
               confVer,
            );
            collector.setPos(value);
            charCheck(value, collector, confVer, false);
            collector.check(!ENCODING_REGEXP.exec(valueText), WFEID.XMLDECL_ENCODING_INVALID, [
               valueText,
            ]);
            break;
         case 'standalone':
            collector.check(foundStandalone, WFEID.XMLDECL_DUPLICATE_STANDALONE);
            foundStandalone = true;
            collector.check(!foundVersion, WFEID.XMLDECL_STANDALONE_INVALID_ORDER);

            checkSpaces(param, FEID.XMLDECL_INVALID_SPACE, undefined, collector, confVer);
            collector.setPos(value);
            charCheck(value, collector, confVer, false);
            collector.check(
               lcValue !== 'no' && lcValue !== 'yes',
               WFEID.XMLDECL_STANDALONE_INVALID,
               [valueText],
            );
            collector.check(valueText !== lcValue, WFEID.XMLDECL_STANDALONE_INVALID_CASE, [
               lcValue,
               valueText,
            ]);
            break;
         default:
            collector.report(WFEID.XMLDECL_PARAM_UNKNOWN, [nameText]);
      }

      prevParam = param;

      collector.setPos(param.valueSpace);

      checkSpaceProblems(param.valueSpace, FEID.XMLDECL_INVALID_SPACE, collector, confVer);
   }

   // No need to test if version was found. Either have encoding or standalone (error) or no params.
   collector.check(params.length === 0, WFEID.XMLDECL_NO_PARAMS);
}

function xmlDeclarationCheck(
   pToken: XmlDeclarationPToken,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   collector.setPos(pToken.open);
   collector.setPos(pToken.openSpace);
   collector.check(pToken.openSpace, WFEID.XMLDECL_SPACE_AFTER_OPEN);
   checkSpaceProblems(pToken.openSpace, FEID.XMLDECL_INVALID_SPACE, collector, confVer);

   collector.setPos(pToken.target);
   charCheck(pToken.target, collector, confVer, false);
   if (pToken.target) {
      const target = strOrBlank(pToken.target);
      const lcTarget = target.toLowerCase();
      collector.check(target !== lcTarget, WFEID.XMLDECL_TARGET_INVALID_CASE, [pToken.target.str]);
   } else {
      collector.report(WFEID.XMLDECL_NO_TARGET);
   }

   collector.setPos(pToken.targetSpace);
   collector.check(!pToken.targetSpace, WFEID.XMLDECL_NO_SPACE_AFTER_TARGET);
   checkSpaceProblems(pToken.targetSpace, FEID.XMLDECL_INVALID_SPACE, collector, confVer);

   checkFields(pToken.fields, collector, confVer);

   collector.setPos(pToken.close);
   collector.check(!pToken.close, WFEID.XMLDECL_NO_CLOSE);
}

export { xmlDeclarationCheck };
