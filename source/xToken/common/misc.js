/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError, XmlWarning } from '../../error';

const WFEID = WellFormedError.ID;
const XWID = XmlWarning.ID;

/* eslint-disable max-len, max-block-comment-len */
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

/* eslint-enable max-len, max-block-comment-len */

/**********************************************************************\
 checkWellFormedNameRecommendation() does a check whether a name starts
 with "xml", and if that is or is not acceptable based on the entity
 version.
\**********************************************************************/

function checkWellFormedNameRecommendation(nameLToken, ec, entityMd, v1R6Warning, otherWarning) {
   if (!nameLToken) {
      return;
   }
   const isV1R6 = entityMd.isVersion1dot0 && entityMd.revision === 6;

   if (isV1R6 && nameLToken.text.substring(0, 4) === 'xml-') {
      ec.reportError(v1R6Warning, XmlWarning, [ nameLToken.text ]);
   } else if (!isV1R6 && nameLToken.text.substring(0, 3).toLocaleLowerCase() === 'xml') {
      ec.reportError(otherWarning, XmlWarning, [ nameLToken.text ]);
   }
}

/**********************************************************************\
 checkWellFormedText() does a check whether the text in a particular
 LToken matches the requirments for text.
\**********************************************************************/

function checkWellFormedText(lToken, ec, entityMd) {
   if (!lToken) {
      return;
   }

   const badIndices = [];
   const discouragedIndices = [];
   const badRegEx = entityMd.isVersion1dot1 ? BAD_CHARS_11 : BAD_CHARS_10;

   badRegEx.lastIndex = 0;
   let found = badRegEx.test(lToken.text);

   if (found) {
      while (found) {
         badIndices.push(lToken.range[0].startIndex - 1 + badRegEx.lastIndex);
         found = badRegEx.test(lToken.text);
      }

      ec.report(WFEID.CHARDATA_INVALID_CHAR, [ badIndices.join(', ') ]);
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
         case 6:
            discouragedRegEx = DISCOURAGED_CHARS_10_5;
            break;
      }
   }

   discouragedRegEx.lastIndex = 0;
   let foundDiscouraged = discouragedRegEx.test(lToken.text);

   if (foundDiscouraged) {
      while (foundDiscouraged) {
         discouragedIndices.push(lToken.range[0].startIndex - 1 + discouragedRegEx.lastIndex);
         foundDiscouraged = discouragedRegEx.test(lToken.text);
      }

      ec.reportError(XWID.CHARDATA_DISCOURAGED_CHAR, XmlWarning, [ discouragedIndices.join(', ') ]);
   }
}

export {
   checkWellFormedNameRecommendation,
   checkWellFormedText,
};
