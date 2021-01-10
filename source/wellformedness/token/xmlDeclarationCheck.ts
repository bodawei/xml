/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { WellFormedError } from 'error';
import { XmlDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { checkCharWellFormed } from '../../token/common/misc';
import { InstructionField } from 'pToken';

const WFEID = WellFormedError.ID;
const ENCODING_REGEXP = /^[A-Za-z][-A-Za-z0-9._]*$/;
const PARAM_NAMES = ['version', 'encoding', 'standalone'];
const VERSION_11_1_REGEXP = /^[-a-zA-Z0-9_.:]+$/;
const VERSION_11_5_REGEXP = /^1.[0-9]$/;
/*
 * Check the value of the vesion="1.0" text.
 * This is a bit more complex/not-obvious than you might expect.
 * First, the ConformanceVersion instance determines what version of the document we think
 * we are parsing. That is often set by this very XML Declaration earlier in parsing,
 * so very often this devolves to checking x === x. However, in some cases someone has
 * enforced that we want to process this as a 1.x document, regardless of what the document
 * says.  Note also that the EnitityMetaData will not support processing at a version number
 * beyond what the whole tiramisu system can support.  So, if the version comes in as
 * 1.7 but the user is parsing as 1.0/5, this will not produce an error, but any 1.7
 * features will result in errors.
 *
 * §2.8.0
 *    Process as 1.0/1: The version number could be is [-a-zA-Z0-9_.:]+
 *    Process as 1.0/[2-4]: The version number can only be 1.0
 *    Process as 1.0/[5-6]: The version number can be 1.[0-9]
 *       Even though the VersionNum production matches any version number of
 *       the form '1.x', XML 1.0 documents should not specify a version number
 *       other than '1.0'.
 *       When an XML 1.0 processor encounters a document that specifies a 1.x
 *       version number other than '1.0', it will process it as a 1.0 document.
 *       This means that an XML 1.0 processor will accept 1.x documents provided
 *       they do not use any non-1.0 features.
 *    Process as 1.1/[1-3]: The version number can be 1.1
 */

function checkVersionString(
   versionText: string,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   if (confVer.version === 1 && confVer.revision === 1) {
      ec.check(!VERSION_11_1_REGEXP.test(versionText), WFEID.XMLDECL_VERSION_INVALD, [versionText]);
   } else if (confVer.version === 1 && confVer.revision < 5) {
      ec.check(versionText !== '1.0', WFEID.XMLDECL_VERSION_INVALD, [versionText]);
   } else if (confVer.version === 1.1) {
      ec.check(versionText !== '1.1', WFEID.XMLDECL_VERSION_INVALD, [versionText]);
   } else {
      ec.check(!VERSION_11_5_REGEXP.test(versionText), WFEID.XMLDECL_VERSION_INVALD, [versionText]);
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
            foundVersion = true;
            ec.check(foundEncoding || foundStandalone, WFEID.XMLDECL_VERSION_INVALID_ORDER);

            ec.setPos(param.nameSpace);
            ec.setPos(param.equal);
            ec.setPos(param.equalSpace);
            ec.setPos(param.openQuote);
            ec.setPos(value);
            checkCharWellFormed(value, ec, confVer);

            checkVersionString(valueText, ec, confVer);
            break;
         case 'encoding':
            foundEncoding = true;
            ec.check(!foundVersion || foundStandalone, WFEID.XMLDECL_ENCODING_INVALID_ORDER);

            ec.setPos(param.nameSpace);
            ec.setPos(param.equal);
            ec.check(!param.equal, WFEID.XMLDECL_ENCODING_NO_EQUAL);
            ec.setPos(param.equalSpace);
            ec.setPos(param.openQuote);
            ec.setPos(value);
            checkCharWellFormed(value, ec, confVer);
            ec.check(!valueText.match(ENCODING_REGEXP), WFEID.XMLDECL_ENCODING_INVALID, [
               valueText,
            ]);
            break;
         case 'standalone':
            foundStandalone = true;
            ec.check(!foundVersion, WFEID.XMLDECL_STANDALONE_INVALID_ORDER);

            ec.setPos(param.nameSpace);
            ec.setPos(param.equal);
            ec.setPos(param.equalSpace);
            ec.setPos(param.openQuote);
            ec.setPos(value);
            checkCharWellFormed(value, ec, confVer);
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

   ec.setPos(pToken.target);
   checkCharWellFormed(pToken.target, ec, confVer);
   if (pToken.target) {
      const target = strOrBlank(pToken.target);
      const lcTarget = target.toLowerCase();
      ec.check(target !== lcTarget, WFEID.XMLDECL_TARGET_INVALID_CASE, [pToken.target.str]);
   } else {
      ec.report(WFEID.XMLDECL_NO_TARGET);
   }

   ec.setPos(pToken.targetSpace);
   ec.check(!pToken.targetSpace, WFEID.XMLDECL_NO_SPACE_AFTER_TARGET);

   checkFields(pToken.fields, ec, confVer);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.XMLDECL_NO_CLOSE);
}

export { xmlDeclarationCheck };
