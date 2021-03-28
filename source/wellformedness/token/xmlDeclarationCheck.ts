/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, XmlFatalError } from 'basic';
import { InstructionField, XmlDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { charCheck } from '../common/charCheck';
import { checkSpaceProblems, checkSpaces } from '../common/xmlTextDeclUtils';
import { WellFormedError } from '../error/WellFormedError';

const WFEID = WellFormedError.ID;
const ENCODING_REGEXP = /^[A-Za-z][-A-Za-z0-9._]*$/;
const PARAM_NAMES = ['version', 'encoding', 'standalone'];
const VERSION_10_1_REGEXP = /^[-a-zA-Z0-9_.:]+$/;
const VERSION_10_5_REGEXP = /^1.[0-9]+$/;

/*
 * Check the value of the vesion="X" text.  See Interpretations.md for full details.
 * Recall that the ConformanceVersion specifies how we are to be interpreting the
 * document. It may, conceivably, not match the version in the XML Declaration.
 *
 * §2.8.0
 *    Process as 1.0/[1-2]: The version number could be is [-a-zA-Z0-9_.:]+
 *    Process as 1.0/[3-4]: The version number can only be 1.0
 *    Process as 1.0/[5-6]: The version number can be 1.[0-9]
 *       Even though the VersionNum production matches any version number of
 *       the form '1.x', XML 1.0 documents should not specify a version number
 *       other than '1.0'.
 *    Process as 1.1/[1-3]: The version number can only be 1.1
 */

function checkVersionString(
   versionText: string,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   if (confVer.version === 1 && confVer.revision <= 2) {
      ec.check(!VERSION_10_1_REGEXP.test(versionText), WFEID.XMLDECL_VERSION_INVALD, [
         "([a-zA-Z0-9_.:] | '-')+",
         versionText,
      ]);
   } else if (confVer.version === 1 && confVer.revision < 5) {
      ec.check(versionText !== '1.0', WFEID.XMLDECL_VERSION_INVALD, ['1.0', versionText]);
   } else if (confVer.version === 1 && confVer.revision >= 5) {
      ec.check(!VERSION_10_5_REGEXP.test(versionText), WFEID.XMLDECL_VERSION_INVALD, [
         '1.[0-9]+',
         versionText,
      ]);
   } else {
      ec.check(versionText !== '1.1', WFEID.XMLDECL_VERSION_INVALD, ['1.1', versionText]);
   }
}

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

            checkSpaces(param, XmlFatalError.ID.XMLDECL_INVALID_SPACE, undefined, ec, confVer);
            ec.setPos(value);
            charCheck(value, ec, confVer);

            checkVersionString(valueText, ec, confVer);
            break;
         case 'encoding':
            ec.check(foundEncoding, WFEID.XMLDECL_DUPLICATE_ENCODING);
            foundEncoding = true;
            ec.check(!foundVersion || foundStandalone, WFEID.XMLDECL_ENCODING_INVALID_ORDER);

            checkSpaces(
               param,
               XmlFatalError.ID.XMLDECL_INVALID_SPACE,
               WFEID.XMLDECL_ENCODING_NO_EQUAL,
               ec,
               confVer,
            );
            ec.setPos(value);
            charCheck(value, ec, confVer);
            ec.check(!ENCODING_REGEXP.exec(valueText), WFEID.XMLDECL_ENCODING_INVALID, [valueText]);
            break;
         case 'standalone':
            ec.check(foundStandalone, WFEID.XMLDECL_DUPLICATE_STANDALONE);
            foundStandalone = true;
            ec.check(!foundVersion, WFEID.XMLDECL_STANDALONE_INVALID_ORDER);

            checkSpaces(param, XmlFatalError.ID.XMLDECL_INVALID_SPACE, undefined, ec, confVer);
            ec.setPos(value);
            charCheck(value, ec, confVer);
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

      checkSpaceProblems(param.valueSpace, XmlFatalError.ID.XMLDECL_INVALID_SPACE, ec, confVer);
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
   checkSpaceProblems(pToken.openSpace, XmlFatalError.ID.XMLDECL_INVALID_SPACE, ec, confVer);

   ec.setPos(pToken.target);
   charCheck(pToken.target, ec, confVer);
   if (pToken.target) {
      const target = strOrBlank(pToken.target);
      const lcTarget = target.toLowerCase();
      ec.check(target !== lcTarget, WFEID.XMLDECL_TARGET_INVALID_CASE, [pToken.target.str]);
   } else {
      ec.report(WFEID.XMLDECL_NO_TARGET);
   }

   ec.setPos(pToken.targetSpace);
   ec.check(!pToken.targetSpace, WFEID.XMLDECL_NO_SPACE_AFTER_TARGET);
   checkSpaceProblems(pToken.targetSpace, XmlFatalError.ID.XMLDECL_INVALID_SPACE, ec, confVer);

   checkFields(pToken.fields, ec, confVer);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.XMLDECL_NO_CLOSE);
}

export { xmlDeclarationCheck };
