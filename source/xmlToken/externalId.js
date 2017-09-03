/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import util from './util.js';

const EXTERNAL_ID = 'EXTERNAL_ID';
const TYPE_TERMINATORS = [ '"', '\'' ];

/**********************************************************************\
 parse() tries to extract an ExternalID or a PublicID from
 the current position in the ChunkSource.

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
\**********************************************************************/

function parse(source, terminators = [], deliverParsed) {
   const allTerminators = TYPE_TERMINATORS.concat(terminators);
   const parsed = {
      type: EXTERNAL_ID,
   };

   source.extract('peekWord', allTerminators, (chunk) => {
      if (!chunk) {
         deliverParsed();
         return;
      }
      const capitalType = chunk.text.toLocaleUpperCase();

      if ([ 'PUBLIC', 'SYSTEM' ].indexOf(capitalType) === -1) {
         deliverParsed();
         return;
      }
      source.extractToObject('word', allTerminators, parsed, 'typeChunk');
      source.extractToObject('space', undefined, parsed, 'postTypeSpaceChunk'); // EEEK

      if (capitalType === 'PUBLIC') {
         util.getQuotedLiteral(source, parsed, 'public', (success) => {
            if (!success) {
               deliverParsed(parsed);
               return;
            }
            source.extractToObject('space', undefined, parsed, 'postPublicSpaceChunk');
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

      util.getQuotedLiteral(source, parsed, 'system', () => {
         deliverParsed(parsed);
      });
   });
}

function checkWellFormed() {
}

function makeToken() {
}

module.exports = {
   TYPE: EXTERNAL_ID,
   parse,
   checkWellFormed,
   makeToken,
};
