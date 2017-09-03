/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { EntityLocation } from '../basic';
import { LToken } from '../lToken';
import { WellFormedError } from '../error';

import util from './util.js';

const WFEID = WellFormedError.ID;

const EXTERNAL_ID = 'EXTERNAL_ID';
const TYPE_TERMINATORS = [ '"', '\'' ];
const PUBID_CHARS = /^[- \n\'\(\)\+,\.\/:=\?;!\*#@$_%a-zA-Z0-9]*/;

/**********************************************************************\
 parse() tries to extract an ExternalID or a PublicID from
 the current position in the LTokenSource.

 SYNTAX
   [75] ExternalID    ::= 'SYSTEM' S SystemLiteral |
                           'PUBLIC' S PubidLiteral S SystemLiteral
   [83] PublicID      ::= 'PUBLIC' S PubidLiteral
   [11] SystemLiteral ::= ('"' [^"]* '"') | ("'" [^']* "'")
   [12] PubidLiteral  ::= '"' PubidChar* '"' |
                           "'" (PubidChar - "'")* "'"
   [13] PubidChar     ::= #x20 | #xD | #xA | [a-zA-Z0-9] |
                           [-'()+,./:=?;!*#@$_%]
 PARAM
   terminators: An array of characters this should terminate parsing
   of the ID.
 RETURN
    If this returns any value, it will always contain a typeLToken.
    If there is no value between quotes, this will return a lToken
    with no contents
\**********************************************************************/

function parse(source, terminators, deliverParsed) {
   if (typeof terminators === 'function') {
      deliverParsed = terminators;
      terminators = [];
   }
   const allTerminators = TYPE_TERMINATORS.concat(terminators);
   const parsed = {
      type: EXTERNAL_ID,
   };

   source.extract('peekWord', allTerminators, (lToken) => {
      const capitalType = lToken && lToken.text.toLocaleUpperCase();

      if (!lToken || [ 'PUBLIC', 'SYSTEM' ].indexOf(capitalType) === -1) {
         deliverParsed();
         return;
      }

      source.extractToObject('word', allTerminators, parsed, 'typeLToken');
      source.extractToObject('space', parsed, 'postTypeSpaceLToken');

      if (capitalType === 'PUBLIC') {
         getQuotedLiteral(source, parsed, 'public', (success) => {
            if (!success) {
               deliverParsed(parsed);
               return;
            }
            source.extractToObject('space', parsed, 'postPublicSpaceLToken');
            getSystemIfAvailable(source, allTerminators, parsed, deliverParsed);
         });
      } else {
         getSystemIfAvailable(source, allTerminators, parsed, deliverParsed);
      }
   });
}

function getSystemIfAvailable(source, allTerminators, parsed, deliverParsed) {
   source.extract('peekWord', allTerminators, (nDataLToken) => {
      if (nDataLToken && nDataLToken.text.toLocaleUpperCase() === 'NDATA') {
         deliverParsed(parsed);
         return;
      }

      getQuotedLiteral(source, parsed, 'system', () => {
         deliverParsed(parsed);
      });
   });
}

function getQuotedLiteral(source, parsed, prefix, done) {
   source.extract('peekChar', (quoteLToken) => {
      if (!quoteLToken || (quoteLToken.text !== '"' && quoteLToken.text !== '\'')) {
         done(false);
         return;
      }

      source.extractToObject('char', parsed, prefix + 'OpenQuoteLToken');
      source.extractToObject('all', [ quoteLToken.text ], parsed, prefix + 'LToken');

      source.extract('match', quoteLToken.text, (closeLToken) => {
         if (!parsed[prefix + 'LToken']) {
            const newRange = quoteLToken.range[0].clone();
            newRange.startIndex = newRange.endIndex;
            newRange.startRow = newRange.endRow;
            newRange.startColumn = newRange.endColumn;
            parsed[prefix + 'LToken'] = new LToken('', '', newRange);
         }
         parsed[prefix + 'CloseQuoteLToken'] = closeLToken;
         done(util.textOrBlank(closeLToken) === quoteLToken.text);
      });
   });
}

function getChunks(results, parsed) {
   if (!parsed) {
      return;
   }

   util.pIfNotBottom(results, parsed.typeLToken);
   util.pIfNotBottom(results, parsed.postTypeSpaceLToken);

   util.pIfNotBottom(results, parsed.publicOpenQuoteLToken);
   util.pIfNotBottom(results, parsed.publicLToken);
   util.pIfNotBottom(results, parsed.publicCloseQuoteLToken);

   util.pIfNotBottom(results, parsed.postPublicSpaceLToken);
   util.pIfNotBottom(results, parsed.systemOpenQuoteLToken);
   util.pIfNotBottom(results, parsed.systemLToken);
   util.pIfNotBottom(results, parsed.systemCloseQuoteLToken);
}

// Nuke this error: EXTERNALID_UNKNOWN
// not sure I like how we're testing errors
// testing of setPos is questionable
// rename EXTERNALID_PUBLIC_NO_LEADING_SPACE
// add EXTERNALID_PUBLIC_NO_CLOSE_QUOTE EXTERNALID_SYSTEM_NO_CLOSE_QUOTE

function checkWellFormed(parsed, ec, systemRequired) {
   if (!parsed) {
      return;
   }

   ec.setPos(parsed.typeLToken);
   const typeText = util.textOrBlank(parsed.typeLToken);
   const capitalType = typeText.toLocaleUpperCase();
   ec.check(typeText !== capitalType, WFEID.EXTERNALID_INVALID_CASE, [ capitalType, typeText ]);

   ec.setPos(parsed.postTypeSpaceLToken);
   ec.check(!parsed.postTypeSpaceLToken, WFEID.EXTERNALID_PUBLIC_NO_LEADING_SPACE); // @@ need better name

   if (capitalType === 'PUBLIC') {
      ec.setPos(parsed.publicOpenQuoteLToken);
      ec.check(!parsed.publicOpenQuoteLToken, WFEID.EXTERNALID_PUBLIC_NO_QUOTE);

      ec.setPos(parsed.publicLToken);
      if (!parsed.publicLToken) {
         ec.report(WFEID.EXTERNALID_NO_PUBLIC);
      } else {
         const match = PUBID_CHARS.exec(parsed.publicLToken.text);
         ec.check(!match || match[0] !== parsed.publicLToken.text, WFEID.EXTERNALID_PUBLIC_INVALID_CHARS,
                  [ parsed.publicLToken.text[match[0].length] ]);
      }

      ec.setPos(parsed.publicCloseQuoteLToken);
      ec.check(!parsed.publicCloseQuoteLToken, WFEID.EXTERNALID_PUBLIC_NO_CLOSE_QUOTE); // new
   }

   if (systemRequired || capitalType === 'SYSTEM' || parsed.systemOpenQuoteLToken || parsed.systemLToken) {
      if (parsed.publicLToken) {
         ec.setPos(parsed.postPublicSpaceLToken);
         ec.check(!parsed.postPublicSpaceLToken, WFEID.EXTERNALID_SYSTEM_NO_LEADING_SPACE);
      }

      ec.setPos(parsed.systemOpenQuoteLToken);
      ec.check(!parsed.systemOpenQuoteLToken, WFEID.EXTERNALID_SYSTEM_NO_QUOTE);

      ec.setPos(parsed.systemLToken);
      ec.check(!parsed.systemLToken, WFEID.EXTERNALID_NO_SYSTEM);
      // XmlText.validateText(externalId.systemId.literalLToken, this._entityMd, start, this);

      ec.setPos(parsed.systemCloseQuoteLToken);
      ec.check(!parsed.systemCloseQuoteLToken, WFEID.EXTERNALID_SYSTEM_NO_CLOSE_QUOTE); // new
   }
}

function makeTokenCompatible(parsed) {
   if (!parsed) {
      return;
   }

   return new EntityLocation(util.textOrUndef(parsed.systemLToken), util.textOrUndef(parsed.publicLToken));
}

module.exports = {
   TYPE: EXTERNAL_ID,
   parse,
   getChunks,
   checkWellFormed,
   makeTokenCompatible,
};
