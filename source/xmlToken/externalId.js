/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import basic from '../basic';
import chunk from '../chunk';
import error from '../error';

import util from './util.js';

const WFEID = error.WellFormedError.ID;

const EXTERNAL_ID = 'EXTERNAL_ID';
const TYPE_TERMINATORS = [ '"', '\'' ];
const PUBID_CHARS = /^[- \n\'\(\)\+,\.\/:=\?;!\*#@$_%a-zA-Z0-9]*/;

/**********************************************************************\
 parse() tries to extract an ExternalID or a PublicID from
 the current position in the ChunkSource.

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
    If this returns any value, it will always contain a typeChunk.
    If there is no value between quotes, this will return a chunk
    with no contents
\**********************************************************************/

function parse(source, terminators = [], deliverParsed) {
   const allTerminators = TYPE_TERMINATORS.concat(terminators);
   const parsed = {
      type: EXTERNAL_ID,
   };

   source.extract('peekWord', allTerminators, (chunk) => {
      const capitalType = chunk && chunk.text.toLocaleUpperCase();

      if (!chunk || [ 'PUBLIC', 'SYSTEM' ].indexOf(capitalType) === -1) {
         deliverParsed();
         return;
      }

      source.extractToObject('word', allTerminators, parsed, 'typeChunk');
      source.extractToObject('space', parsed, 'postTypeSpaceChunk');

      if (capitalType === 'PUBLIC') {
         getQuotedLiteral(source, parsed, 'public', (success) => {
            if (!success) {
               deliverParsed(parsed);
               return;
            }
            source.extractToObject('space', parsed, 'postPublicSpaceChunk');
            getSystemIfAvailable(source, allTerminators, parsed, deliverParsed);
         });
      } else {
         getSystemIfAvailable(source, allTerminators, parsed, deliverParsed);
      }
   });
}

function getSystemIfAvailable(source, allTerminators, parsed, deliverParsed) {
   source.extract('peekWord', allTerminators, (nDataChunk) => {
      if (nDataChunk && nDataChunk.text.toLocaleUpperCase() === 'NDATA') {
         deliverParsed(parsed);
         return;
      }

      getQuotedLiteral(source, parsed, 'system', () => {
         deliverParsed(parsed);
      });
   });
}

function getQuotedLiteral(source, parsed, prefix, done) {
   source.extract('peekChar', (quoteChunk) => {
      if (!quoteChunk || (quoteChunk.text !== '"' && quoteChunk.text !== '\'')) {
         done(false);
         return;
      }

      source.extractToObject('char', parsed, prefix + 'OpenQuoteChunk');
      source.extractToObject('all', parsed, prefix + 'Chunk');

      source.extract('match', quoteChunk.text, (closeChunk) => {
         if (!parsed[prefix + 'Chunk']) {
            const newRange = quoteChunk.range[0].clone();
            newRange.startIndex = newRange.endIndex;
            newRange.startRow = newRange.endRow;
            newRange.startColumn = newRange.endColumn;
            parsed[prefix + 'Chunk'] = new chunk.Chunk('', '', newRange);
         }
         parsed[prefix + 'CloseQuoteChunk'] = closeChunk;
         done(util.textOrBlank(closeChunk) === quoteChunk.text);
      });
   });
}

// Nuke this error: EXTERNALID_UNKNOWN
// not sure I like how we're testing errors
// testing of setPos is questionable
// rename EXTERNALID_PUBLIC_NO_LEADING_SPACE
// add EXTERNALID_PUBLIC_NO_CLOSE_QUOTE EXTERNALID_SYSTEM_NO_CLOSE_QUOTE

function checkWellFormed(parsed, systemRequired, openChunk, isDocEntity, version, revision) {
   const ec = new basic.ErrorCollector(openChunk, error.WellFormedError);

   if (!parsed) {
      return ec;
   }

   ec.setPos(parsed.typeChunk);
   const typeText = util.textOrBlank(parsed.typeChunk);
   const capitalType = typeText.toLocaleUpperCase();
   ec.check(typeText !== capitalType, WFEID.EXTERNALID_INVALID_CASE, [ capitalType, typeText ]);

   ec.setPos(parsed.postTypeSpaceChunk);
   ec.check(!parsed.postTypeSpaceChunk, WFEID.EXTERNALID_PUBLIC_NO_LEADING_SPACE); // @@ need better name

   if (capitalType === 'PUBLIC') {
      ec.setPos(parsed.publicOpenQuoteChunk);

      if (!parsed.publicChunk) {
         ec.report(WFEID.EXTERNALID_NO_PUBLIC);
      } else {
         ec.check(!parsed.publicOpenQuoteChunk, WFEID.EXTERNALID_PUBLIC_NO_QUOTE);

         ec.setPos(parsed.publicChunk);
         const match = PUBID_CHARS.exec(parsed.publicChunk.text);
         ec.check(!match || match[0] !== parsed.publicChunk.text, WFEID.EXTERNALID_PUBLIC_INVALID_CHARS,
                  [ parsed.publicChunk.text[ match ? match[0].length : 0] ]);

         ec.setPos(parsed.publicCloseQuoteChunk);
         ec.check(!parsed.publicCloseQuoteChunk, WFEID.EXTERNALID_PUBLIC_NO_CLOSE_QUOTE); // new
      }
   }

   if (systemRequired || capitalType === 'SYSTEM') {
      ec.setPos(parsed.systemOpenQuoteChunk);

      if (!parsed.systemChunk) {
         ec.report(WFEID.EXTERNALID_NO_SYSTEM);
      } else {
         if (externalId.publicId) {
            ec.check(!parsed.postPublicSpaceChunk, WFEID.EXTERNALID_SYSTEM_NO_LEADING_SPACE);
         }

         ec.check(!parsed.systemOpenQuoteChunk, WFEID.EXTERNALID_SYSTEM_NO_QUOTE);

         ec.setPos(parsed.systemChunk);
         // XmlText.validateText(externalId.systemId.literalChunk, this._entityMd, start, this);

         ec.setPos(parsed.systemCloseQuoteChunk);
         ec.check(!parsed.systemCloseQuoteChunk, WFEID.EXTERNALID_SYSTEM_NO_CLOSE_QUOTE); // new
      }
   }

   return ec;
}

module.exports = {
   TYPE: EXTERNAL_ID,
   parse,
   checkWellFormed,
};
