/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { EntityLocation } from '../../basic';
import { WellFormedError } from '../../error';

import * as quotedValue from './quotedValue.js';
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
const ALLOWED_TYPES = [ 'PUBLIC', 'SYSTEM' ];
const PUBLIC_PREFIX = 'public';
const SYSTEM_PREFIX = 'system';
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

      if (!lToken || ALLOWED_TYPES.indexOf(capitalType) === -1) {
         deliverParsed();
         return;
      }

      source.extractToObject('word', allTerminators, parsed, 'idType');
      source.extractToObject('space', parsed, 'postIdTypeSpace');

      if (capitalType === 'PUBLIC') {
         quotedValue.parse(PUBLIC_PREFIX, source, parsed, (gotQuoted) => {
            if (!gotQuoted) {
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

      quotedValue.parse(SYSTEM_PREFIX, source, parsed, () => {
         deliverParsed(parsed);
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
   ec.check(ALLOWED_TYPES.indexOf(capitalType) === -1, WFEID.EXTERNALID_UNKNOWN, [ typeText ]);
   ec.check(typeText !== capitalType, WFEID.EXTERNALID_INVALID_CASE, [ capitalType, typeText ]);

   ec.setPos(parsed.postIdTypeSpace);
   ec.check(!parsed.postIdTypeSpace, WFEID.EXTERNALID_IDTYPE_NO_SPACE);

   if (capitalType === 'PUBLIC') {
      quotedValue.checkWellFormed(PUBLIC_PREFIX, parsed, ec, entityMetaData, WFEID.NOUN_EXTERNALID_PUBLIC, () => {
         const match = PUBID_CHARS.exec(parsed.publicValue.text);
         ec.check(!match || match[0] !== parsed.publicValue.text, WFEID.EXTERNALID_PUBLIC_INVALID_CHARS,
                  [ parsed.publicValue.text[match[0].length] ]);
      });
   }

   if (capitalType === 'SYSTEM' || parsed.systemOpenQuote || parsed.systemValue) {
      if (parsed.publicValue) {
         ec.setPos(parsed.postPublicSpace);
         ec.check(!parsed.postPublicSpace, WFEID.EXTERNALID_SYSTEM_NO_LEADING_SPACE);
      }

      quotedValue.checkWellFormed(SYSTEM_PREFIX, parsed, ec, entityMetaData, WFEID.NOUN_EXTERNALID_SYSTEM);
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

function appendLTokens(results, parsed) {
   if (!parsed) {
      return;
   }

   pushNonBottom(results, parsed.idType);
   pushNonBottom(results, parsed.postIdTypeSpace);

   quotedValue.appendLTokens(PUBLIC_PREFIX, results, parsed);
   pushNonBottom(results, parsed.postPublicSpace);
   quotedValue.appendLTokens(SYSTEM_PREFIX, results, parsed);
}

export {
   EXTERNAL_ID as TYPE,
   parse,
   appendLTokens,
   checkWellFormed,
   makeTokenCompatible,
};
