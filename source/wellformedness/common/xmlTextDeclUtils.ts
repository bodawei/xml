/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { InstructionField } from 'pToken';
import { SToken } from 'basic';

import { Error } from '../error/error';
import { FatalError } from '../error/fatalError';
import { Warning } from '../error/warning';
import { wellFormedErrorCodes } from '../error/wellFormedError';
import { warningCodes } from '../error/warningCodes';
import { errorCodes } from '../error/errorCodes';

const EID = errorCodes.id;
const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;
const S_REGEXP = /^[\t\r\n ]*$/;
const VERSION_10_1_REGEXP = /^[-a-zA-Z0-9_.:]+$/;
const VERSION_10_5_REGEXP = /^1.[0-9]+$/;

/*
 * Check the value of the vesion="X" text.  See Interpretations.md for full details.
 * Recall that the ConformanceVersion specifies how we are to be interpreting the
 * document. It may, conceivably, not match the version in the XML Declaration.
 *
 * §2.8.0
 *    The allowed syntax is:
 *    Process as 1.0/[1-2]: The version number could be is [-a-zA-Z0-9_.:]+
 *    Process as 1.0/[3-4]: The version number can only be 1.0
 *    Process as 1.0/[5-6]: The version number can be 1.[0-9]
 *    Process as 1.1/[1-3]: The version number can only be 1.1
 *
 *    Additionally, 1.0/1 and 1.0/2 say:
 *       The version number "1.0" should be used to indicate conformance to
 *       this version of this specification; it is an error for a document
 *       to use the value "1.0" if it does not conform to this version of
 *       this specification.
 *       ...
 *       Processors may signal an error if they receive documents labeled
 *       with versions they do not support.
 *    And 1.0/5 says:
 *       Even though the VersionNum production matches any version number of
 *       the form '1.x', XML 1.0 documents should not specify a version number
 *       other than '1.0'.
 *    Yet, the XML Conformance test x-rmt-008 says an error should be generated if 1.7
 *    is used in editions 1-4.
 */

function checkVersionString(
   versionText: string,
   isXmlDecl: boolean,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   const code = isXmlDecl ? WFEID.XMLDECL_VERSION_INVALD : WFEID.TEXTDECL_VERSION_INVALD;

   if (confVer.version === 1 && confVer.edition <= 2) {
      const doesNotMatchSyntax = !VERSION_10_1_REGEXP.test(versionText);
      const isNot10 = versionText !== '1.0';

      if (doesNotMatchSyntax) {
         collector.report(code, ["([a-zA-Z0-9_.:] | '-')+", versionText]);
      } else if (isNot10) {
         collector.reportProblem(
            Error,
            isXmlDecl ? EID.XMLDECL_VERSION_INVALID : EID.TEXTDECL_VERSION_INVALID,
            ['1.0', versionText],
         );
      }
   } else if (confVer.version === 1 && confVer.edition < 5) {
      collector.check(versionText !== '1.0', code, ['1.0', versionText]);
   } else if (confVer.version === 1 && confVer.edition >= 5) {
      const doesNotMatchSyntax = !VERSION_10_5_REGEXP.test(versionText);
      const isNot10 = versionText !== '1.0';

      if (doesNotMatchSyntax) {
         collector.report(code, ['1.[0-9]+', versionText]);
      } else if (isNot10) {
         if (isXmlDecl) {
            collector.reportProblem(Warning, WID.XMLDECL_VERSION_INVALID, ['1.0', versionText]);
            // We interpret "should not" to mean warning, since the "should not"s in the spec do not represent errors
         } else {
            // We'd ike to consider this a warning too, but there are xmlconf tests which want an error in thise case
            collector.report(code, ['1.0', versionText]);
         }
      }
   } else {
      // Text declarations may be 1.0 even if the overall document is 1.1
      const condition = isXmlDecl
         ? versionText !== '1.1'
         : versionText !== '1.1' && versionText !== '1.0';
      const allowed = isXmlDecl ? '1.1' : '1.0/1.1';

      collector.check(condition, code, [allowed, versionText]);
   }
}

function checkSpaceProblems(
   sToken: SToken | undefined,
   code: string,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   const text = sToken?.originalStr ?? '';

   if (S_REGEXP.test(text) || confVer.version === 1) {
      return;
   }

   const chars = text.split('');

   for (const char of chars) {
      if (!S_REGEXP.test(char)) {
         // §2.11.0 Therefore, it is a fatal error to use them
         //    within the XML declaration or text declaration.
         collector.reportProblem(FatalError, code, [char.charCodeAt(0).toString(16)]);
      }
   }
}
function checkSpaces(
   param: InstructionField,
   spaceCode: string,
   equalCode: string | undefined,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   collector.setPos(param.nameSpace);
   checkSpaceProblems(param.nameSpace, spaceCode, collector, confVer);
   collector.setPos(param.equal);

   if (equalCode) {
      collector.check(!param.equal, equalCode);
   }

   collector.setPos(param.equalSpace);
   checkSpaceProblems(param.equalSpace, spaceCode, collector, confVer);
   collector.setPos(param.openQuote);
}
export { checkSpaceProblems, checkSpaces, checkVersionString };
