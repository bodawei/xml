/*Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

const SyntaxError = require('./error/SyntaxError.js');
const XmlWarning = require('./error/XmlWarning.js');

const SEID = SyntaxError.ID;
const XWID = XmlWarning.ID;

const BAD_CHARS_11 = /[\u0000\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u0084\u0086-\u009F\uFFFE\uFFFF]/g;
const BAD_CHARS_10 = /[\u0000\u0001-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;

/*
 * \u1FFFE-\u1FFFF\u2FFFE-\u2FFFF\u3FFFE-\u3FFFF\u4FFFE-\u4FFFF\u5FFFE-\u5FFFF\u6FFFE-\u6FFFF\u7FFFE-\u7FFFF\u8FFFE-\u8FFFF\u9FFFE-\u9FFFF\uAFFFE-\uAFFFF\uBFFFE-\uBFFFF\uCFFFE-\uCFFFF\uDFFFE-\uDFFFF\uEFFFE-\uEFFFF\uFFFFE-\uFFFFF\u10FFFE-\u10FFFF
 * is the same as
 * \uD83F\uDFFE|\uD83F\uDFFF|\uD87F\uDFFE|\uD87F\uDFFF|\uD8BF\uDFFE|\uD8BF\uDFFF|\uD8FF\uDFFE|\uD8FF\uDFFF|\uD93F\uDFFE|\uD93F\uDFFF|\uD97F\uDFFE|\uD97F\uDFFF|\uD9BF\uDFFE|\uD9BF\uDFFF|\uD9FF\uDFFE|\uD9FF\uDFFF|\uDA3F\uDFFE|\uDA3F\uDFFF|\uDA7F\uDFFE|\uDA7F\uDFFF|\uDABF\uDFFE|\uDABF\uDFFF|\uDAFF\uDFFE|\uDAFF\uDFFF|\uDB3F\uDFFE|\uDB3F\uDFFF|\uDB7F\uDFFE|\uDB7F\uDFFF|\uDBBF\uDFFE|\uDBBF\uDFFF|\uDBFF\uDFFE|\uDBFF\uDFFF
 */
const DISCOURAGED_CHARS_11 = /[\uFDD0-\uFDDF]|\uD83F\uDFFE|\uD83F\uDFFF|\uD87F\uDFFE|\uD87F\uDFFF|\uD8BF\uDFFE|\uD8BF\uDFFF|\uD8FF\uDFFE|\uD8FF\uDFFF|\uD93F\uDFFE|\uD93F\uDFFF|\uD97F\uDFFE|\uD97F\uDFFF|\uD9BF\uDFFE|\uD9BF\uDFFF|\uD9FF\uDFFE|\uD9FF\uDFFF|\uDA3F\uDFFE|\uDA3F\uDFFF|\uDA7F\uDFFE|\uDA7F\uDFFF|\uDABF\uDFFE|\uDABF\uDFFF|\uDAFF\uDFFE|\uDAFF\uDFFF|\uDB3F\uDFFE|\uDB3F\uDFFF|\uDB7F\uDFFE|\uDB7F\uDFFF|\uDBBF\uDFFE|\uDBBF\uDFFF|\uDBFF\uDFFE|\uDBFF\uDFFF/g;
const DISCOURAGED_CHARS_10_5 = /[\u007F-\u0084\u0086-\u009F\uFDD0-\uFDEF]|\uD83F\uDFFE|\uD83F\uDFFF|\uD87F\uDFFE|\uD87F\uDFFF|\uD8BF\uDFFE|\uD8BF\uDFFF|\uD8FF\uDFFE|\uD8FF\uDFFF|\uD93F\uDFFE|\uD93F\uDFFF|\uD97F\uDFFE|\uD97F\uDFFF|\uD9BF\uDFFE|\uD9BF\uDFFF|\uD9FF\uDFFE|\uD9FF\uDFFF|\uDA3F\uDFFE|\uDA3F\uDFFF|\uDA7F\uDFFE|\uDA7F\uDFFF|\uDABF\uDFFE|\uDABF\uDFFF|\uDAFF\uDFFE|\uDAFF\uDFFF|\uDB3F\uDFFE|\uDB3F\uDFFF|\uDB7F\uDFFE|\uDB7F\uDFFF|\uDBBF\uDFFE|\uDBBF\uDFFF|\uDBFF\uDFFE|\uDBFF\uDFFF/g;
const DISCOURAGED_CHARS_10_3_4 = /[\u007F-\u0084\u0086-\u009F\uFDD0-\uFDDF]|\uD83F\uDFFE|\uD83F\uDFFF|\uD87F\uDFFE|\uD87F\uDFFF|\uD8BF\uDFFE|\uD8BF\uDFFF|\uD8FF\uDFFE|\uD8FF\uDFFF|\uD93F\uDFFE|\uD93F\uDFFF|\uD97F\uDFFE|\uD97F\uDFFF|\uD9BF\uDFFE|\uD9BF\uDFFF|\uD9FF\uDFFE|\uD9FF\uDFFF|\uDA3F\uDFFE|\uDA3F\uDFFF|\uDA7F\uDFFE|\uDA7F\uDFFF|\uDABF\uDFFE|\uDABF\uDFFF|\uDAFF\uDFFE|\uDAFF\uDFFF|\uDB3F\uDFFE|\uDB3F\uDFFF|\uDB7F\uDFFE|\uDB7F\uDFFF|\uDBBF\uDFFE|\uDBBF\uDFFF|\uDBFF\uDFFE|\uDBFF\uDFFF/g;

/**********************************************************************\
 Utilities related to text
\**********************************************************************/

const XmlText = {

   validateText(chunk, entityMd, start, reporter) {
      if (!chunk) {
         return;
      }

      const badIndices = [];
      const discouragedIndices = [];
      const badRegEx = entityMd.isVersion1dot1 ? BAD_CHARS_11 : BAD_CHARS_10;

      badRegEx.lastIndex = 0;
      let found = badRegEx.test(chunk.text);

      if (found) {
         while (found) {
            badIndices.push(chunk.startOffset.index - 1 + badRegEx.lastIndex);
            found = badRegEx.test(chunk.text);
         }

         reporter._report(SEID.CHARDATA_INVALID_CHAR, [ badIndices.join(', ') ], start, start);
      }

      let discouragedRegEx;

      if (entityMd.isVersion1dot1) {
         discouragedRegEx = DISCOURAGED_CHARS_11;
      } else {
         switch (entityMd.revision) {
            case 1:
            case 2:
               return; // no discouraged characters here
            case 3:
            case 4:
               discouragedRegEx = DISCOURAGED_CHARS_10_3_4;
               break;
            case 5:
               discouragedRegEx = DISCOURAGED_CHARS_10_5;
               break;
         }
      }

      discouragedRegEx.lastIndex = 0;
      let foundDiscouraged = discouragedRegEx.test(chunk.text);

      if (foundDiscouraged) {
         while (foundDiscouraged) {
            discouragedIndices.push(chunk.startOffset.index - 1 + discouragedRegEx.lastIndex);
            foundDiscouraged = discouragedRegEx.test(chunk.text);
         }

         reporter._warn(XWID.CHARDATA_DISCOURAGED_CHAR, [ discouragedIndices.join(', ') ], start, start);
      }
   }


};

module.exports = XmlText;
