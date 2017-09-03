/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { EntityLocation } from '../basic';
import { LToken } from '../lToken';
import { WellFormedError } from '../error';

import * as misc from './misc.js';
import {
   pushNonBottom,
   textOrBlank,
   textOrUndef,
 } from './util.js';

/**********************************************************************\
 The externalId namespace has routines for processing external ID's
 as found in ENTITY, DOCTYPE, and NOTATION declarations.

 This include parsing, validating and turning into a form ready for
 insertion into a token.
\**********************************************************************/

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
   source: A LTokenSource to read from
   terminators: An array of characters this should terminate parsing
      of the ID.
   deliverParsed: Callback to deliver the parsed lTokens
\**********************************************************************/

function parse(source, terminators, deliverParsed) {
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

      source.extractToObject('word', allTerminators, parsed, 'idType');
      source.extractToObject('space', parsed, 'postTypeSpace');

      if (capitalType === 'PUBLIC') {
         getQuotedLiteral(source, parsed, 'public', (success) => {
            if (!success) {
               deliverParsed(parsed);
               return;
            }
            source.extractToObject('space', parsed, 'postPublicSpace');
            getSystemIfAvailable(source, allTerminators, parsed, deliverParsed);
         });
      } else {
         getSystemIfAvailable(source, allTerminators, parsed, deliverParsed);
      }
   });
}

function getSystemIfAvailable(source, allTerminators, parsed, deliverParsed) {
   source.extract('peekWord', allTerminators, (nData) => {
      if (nData && nData.text.toLocaleUpperCase() === 'NDATA') {
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

      source.extractToObject('char', parsed, prefix + 'OpenQuote');
      source.extractToObject('all', [ quoteLToken.text ], parsed, prefix + 'Value');

      source.extract('match', quoteLToken.text, (closeLToken) => {
         if (!parsed[prefix + 'Value']) {
            const newRange = quoteLToken.range[0].clone();
            newRange.startIndex = newRange.endIndex;
            newRange.startRow = newRange.endRow;
            newRange.startColumn = newRange.endColumn;
            parsed[prefix + 'Value'] = new LToken('', '', newRange);
         }
         parsed[prefix + 'CloseQuote'] = closeLToken;
         done(textOrBlank(closeLToken) === quoteLToken.text);
      });
   });
}

/**********************************************************************\
 checkWellFormed() does a well formed check on the parsed value, and
 reports any error through the error collector.

 PARAM
   parsed: A parsed externalId as produced, above
   ec: An ErrorCollector instance.
\**********************************************************************/

function checkWellFormed(parsed, ec, entityMetaData) {
   if (!parsed) {
      return;
   }

   ec.setPos(parsed.idType);
   const typeText = textOrBlank(parsed.idType);
   const capitalType = typeText.toLocaleUpperCase();
   ec.check(typeText !== capitalType, WFEID.EXTERNALID_INVALID_CASE, [ capitalType, typeText ]);

   ec.setPos(parsed.postTypeSpace);
   ec.check(!parsed.postTypeSpace, WFEID.EXTERNALID_PUBLIC_NO_LEADING_SPACE); // @@ need better name

   if (capitalType === 'PUBLIC') {
      ec.setPos(parsed.publicOpenQuote);
      ec.check(!parsed.publicOpenQuote, WFEID.EXTERNALID_PUBLIC_NO_QUOTE);

      ec.setPos(parsed.publicValue);
      if (!parsed.publicValue) {
         ec.report(WFEID.EXTERNALID_NO_PUBLIC);
      } else {
         const match = PUBID_CHARS.exec(parsed.publicValue.text);
         ec.check(!match || match[0] !== parsed.publicValue.text, WFEID.EXTERNALID_PUBLIC_INVALID_CHARS,
                  [ parsed.publicValue.text[match[0].length] ]);
      }

      ec.setPos(parsed.publicCloseQuote);
      ec.check(!parsed.publicCloseQuote, WFEID.EXTERNALID_PUBLIC_NO_CLOSE_QUOTE); // new
   }

   if (capitalType === 'SYSTEM' || parsed.systemOpenQuote || parsed.systemValue) {
      if (parsed.publicValue) {
         ec.setPos(parsed.postPublicSpace);
         ec.check(!parsed.postPublicSpace, WFEID.EXTERNALID_SYSTEM_NO_LEADING_SPACE);
      }

      ec.setPos(parsed.systemOpenQuote);
      ec.check(!parsed.systemOpenQuote, WFEID.EXTERNALID_SYSTEM_NO_QUOTE);

      ec.setPos(parsed.systemValue);
      ec.check(!parsed.systemValue, WFEID.EXTERNALID_NO_SYSTEM);
      misc.checkWellFormedText(parsed.systemValue, ec, entityMetaData);

      ec.setPos(parsed.systemCloseQuote);
      ec.check(!parsed.systemCloseQuote, WFEID.EXTERNALID_SYSTEM_NO_CLOSE_QUOTE); // new
   }
}

/**********************************************************************\
 makeTokenCompatible() converts a parsed value into a form that
 can be inserted into a token.
\**********************************************************************/

function makeTokenCompatible(parsed) {
   if (!parsed) {
      return;
   }

   return new EntityLocation(textOrUndef(parsed.systemValue), textOrUndef(parsed.publicValue));
}

function getLTokens(results, parsed) {
   if (!parsed) {
      return;
   }

   pushNonBottom(results, parsed.idType);
   pushNonBottom(results, parsed.postTypeSpace);

   pushNonBottom(results, parsed.publicOpenQuote);
   pushNonBottom(results, parsed.publicValue);
   pushNonBottom(results, parsed.publicCloseQuote);

   pushNonBottom(results, parsed.postPublicSpace);

   pushNonBottom(results, parsed.systemOpenQuote);
   pushNonBottom(results, parsed.systemValue);
   pushNonBottom(results, parsed.systemCloseQuote);
}

export {
   EXTERNAL_ID as TYPE,
   parse,
   getLTokens,
   checkWellFormed,
   makeTokenCompatible,
};
