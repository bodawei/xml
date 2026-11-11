/* Copyright ® 2016-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { SToken } from 'basic';

import { Warning } from '../error/warning';
import { warningCodes } from '../error/warningCodes';
import { wellFormedErrorCodes } from '../error/wellFormedError';

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

const BAD_CHARS_11 =
   /[\u0000\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u0084\u0086-\u009F\uFFFE\uFFFF]/g;
const BAD_CHARS_10 = /[\u0000\u0001-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;

const BAD_SECOND_PASS_CHARS_11 = /[\u0000\uFFFE\uFFFF]/g;

/*
 * \u1FFFE-\u1FFFF\u2FFFE-\u2FFFF\u3FFFE-\u3FFFF\u4FFFE-\u4FFFF\u5FFFE-\u5FFFF\u6FFFE-\u6FFFF\u7FFFE-\u7FFFF\u8FFFE-\u8FFFF\u9FFFE-\u9FFFF\uAFFFE-\uAFFFF\uBFFFE-\uBFFFF\uCFFFE-\uCFFFF\uDFFFE-\uDFFFF\uEFFFE-\uEFFFF\uFFFFE-\uFFFFF\u10FFFE-\u10FFFF
 * is the same as
 * \uD83F\uDFFE|\uD83F\uDFFF|\uD87F\uDFFE|\uD87F\uDFFF|\uD8BF\uDFFE|\uD8BF\uDFFF|\uD8FF\uDFFE|\uD8FF\uDFFF|\uD93F\uDFFE|\uD93F\uDFFF|\uD97F\uDFFE|\uD97F\uDFFF|\uD9BF\uDFFE|\uD9BF\uDFFF|\uD9FF\uDFFE|\uD9FF\uDFFF|\uDA3F\uDFFE|\uDA3F\uDFFF|\uDA7F\uDFFE|\uDA7F\uDFFF|\uDABF\uDFFE|\uDABF\uDFFF|\uDAFF\uDFFE|\uDAFF\uDFFF|\uDB3F\uDFFE|\uDB3F\uDFFF|\uDB7F\uDFFE|\uDB7F\uDFFF|\uDBBF\uDFFE|\uDBBF\uDFFF|\uDBFF\uDFFE|\uDBFF\uDFFF
 */
const DISCOURAGED_CHARS_11 =
   /[\uFDD0-\uFDDF]|\uD83F\uDFFE|\uD83F\uDFFF|\uD87F\uDFFE|\uD87F\uDFFF|\uD8BF\uDFFE|\uD8BF\uDFFF|\uD8FF\uDFFE|\uD8FF\uDFFF|\uD93F\uDFFE|\uD93F\uDFFF|\uD97F\uDFFE|\uD97F\uDFFF|\uD9BF\uDFFE|\uD9BF\uDFFF|\uD9FF\uDFFE|\uD9FF\uDFFF|\uDA3F\uDFFE|\uDA3F\uDFFF|\uDA7F\uDFFE|\uDA7F\uDFFF|\uDABF\uDFFE|\uDABF\uDFFF|\uDAFF\uDFFE|\uDAFF\uDFFF|\uDB3F\uDFFE|\uDB3F\uDFFF|\uDB7F\uDFFE|\uDB7F\uDFFF|\uDBBF\uDFFE|\uDBBF\uDFFF|\uDBFF\uDFFE|\uDBFF\uDFFF/g;
const DISCOURAGED_CHARS_10_5 =
   /[\u007F-\u0084\u0086-\u009F\uFDD0-\uFDEF]|\uD83F\uDFFE|\uD83F\uDFFF|\uD87F\uDFFE|\uD87F\uDFFF|\uD8BF\uDFFE|\uD8BF\uDFFF|\uD8FF\uDFFE|\uD8FF\uDFFF|\uD93F\uDFFE|\uD93F\uDFFF|\uD97F\uDFFE|\uD97F\uDFFF|\uD9BF\uDFFE|\uD9BF\uDFFF|\uD9FF\uDFFE|\uD9FF\uDFFF|\uDA3F\uDFFE|\uDA3F\uDFFF|\uDA7F\uDFFE|\uDA7F\uDFFF|\uDABF\uDFFE|\uDABF\uDFFF|\uDAFF\uDFFE|\uDAFF\uDFFF|\uDB3F\uDFFE|\uDB3F\uDFFF|\uDB7F\uDFFE|\uDB7F\uDFFF|\uDBBF\uDFFE|\uDBBF\uDFFF|\uDBFF\uDFFE|\uDBFF\uDFFF/g;
const DISCOURAGED_CHARS_10_3_4 =
   /[\u007F-\u0084\u0086-\u009F\uFDD0-\uFDDF]|\uD83F\uDFFE|\uD83F\uDFFF|\uD87F\uDFFE|\uD87F\uDFFF|\uD8BF\uDFFE|\uD8BF\uDFFF|\uD8FF\uDFFE|\uD8FF\uDFFF|\uD93F\uDFFE|\uD93F\uDFFF|\uD97F\uDFFE|\uD97F\uDFFF|\uD9BF\uDFFE|\uD9BF\uDFFF|\uD9FF\uDFFE|\uD9FF\uDFFF|\uDA3F\uDFFE|\uDA3F\uDFFF|\uDA7F\uDFFE|\uDA7F\uDFFF|\uDABF\uDFFE|\uDABF\uDFFF|\uDAFF\uDFFE|\uDAFF\uDFFF|\uDB3F\uDFFE|\uDB3F\uDFFF|\uDB7F\uDFFE|\uDB7F\uDFFF|\uDBBF\uDFFE|\uDBBF\uDFFF|\uDBFF\uDFFE|\uDBFF\uDFFF/g;

const LONE_SURROGATE =
   /([^\uD800-\uDFFF][\uD800-\uDFFF][^\uD800-\uDFFF])|(^[\uD800-\uDFFF][^\uD800-\uDFFF])|([^\uD800-\uDFFF][\uD800-\uDFFF]$)|(^[\uD800-\uDFFF]$)/g;

/**********************************************************************\
 charCheck() does a check whether the text in a particular
 SToken matches the requirments for text.

 TEMP: This is actually validating that the text is all §2.2's Char with no RestrictedChar's
\**********************************************************************/

function charCheck(
   sToken: SToken | undefined,
   collector: Collector,
   confVer: ConformanceVersion,
   isSecondPass: boolean,
): void {
   if (!sToken) {
      return;
   }

   const badIndices = [];
   const discouragedIndices = [];
   let badRegEx: RegExp;

   if (isSecondPass) {
      badRegEx = confVer.version === 1.1 ? BAD_SECOND_PASS_CHARS_11 : BAD_CHARS_10;
   } else {
      badRegEx = confVer.version === 1.1 ? BAD_CHARS_11 : BAD_CHARS_10;
   }

   badRegEx.lastIndex = 0;
   let found = badRegEx.test(sToken.str);

   if (found) {
      while (found) {
         badIndices.push(sToken.ranges[0].startIndex - 1 + badRegEx.lastIndex);
         found = badRegEx.test(sToken.str);
      }

      collector.report(WFEID.CHARDATA_INVALID_CHAR, [badIndices.join(', ')]);
   }

   LONE_SURROGATE.lastIndex = 0;
   if (LONE_SURROGATE.test(sToken.str)) {
      collector.report(WFEID.CHARDATA_INVALID_CHAR, [
         String(sToken.ranges[0].startIndex - 1 + LONE_SURROGATE.lastIndex),
      ]);
   }

   let discouragedRegEx: RegExp;

   if (confVer.version === 1.1) {
      discouragedRegEx = DISCOURAGED_CHARS_11;
   } else {
      switch (confVer.edition) {
         case 1:
         case 2:
            return; // no discouraged characters here
         case 3:
         case 4:
            discouragedRegEx = DISCOURAGED_CHARS_10_3_4;
            break;
         case 5:
         case 6:
            discouragedRegEx = DISCOURAGED_CHARS_10_5;
            break;
      }
   }

   discouragedRegEx.lastIndex = 0;
   let foundDiscouraged = discouragedRegEx.test(sToken.str);

   if (foundDiscouraged) {
      while (foundDiscouraged) {
         discouragedIndices.push(sToken.ranges[0].startIndex - 1 + discouragedRegEx.lastIndex);
         foundDiscouraged = discouragedRegEx.test(sToken.str);
      }

      collector.reportProblem(Warning, WID.CHARDATA_DISCOURAGED_CHAR, [
         discouragedIndices.join(', '),
      ]);
   }
}

export { charCheck };
