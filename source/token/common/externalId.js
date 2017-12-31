/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { EntityLocation } from '../../basic';
import { WellFormedError } from '../../error';

import entityReference from '../entityReference.js';

import literal from './literal.js';
import { textOrBlank } from './misc.js';
import * as usp from './usp.js';

/**********************************************************************\
 The externalId namespace has routines for processing external ID's
 as found in ENTITY, DOCTYPE, and NOTATION declarations.

 This include parsing, validating and turning into a form ready for
 insertion into a token.
\**********************************************************************/

const WFEID = WellFormedError.ID;
const EXTERNAL_ID = 'EXTERNAL_ID';
const ALLOWED_TYPES = [ 'PUBLIC', 'SYSTEM' ];
const TYPE_TERMINATORS = [ '"', '\'' ];
const PUBID_CHARS = /^[- \n\'\(\)\+,\.\/:=\?;!\*#@$_%a-zA-Z0-9]*/;

/**********************************************************************\
 parse() tries to extract an ExternalID or a PublicID from
 the current position in the STokenSource.

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
   source: A STokenSource to read from
   terminators: An array of characters this should terminate parsing
      of the ID.
   deliverPTokenPart: Callback to deliver the PToken compatible version
\**********************************************************************/

function parse(source, terminators, deliverPTokenPart) {
   const allTerminators = TYPE_TERMINATORS.concat(terminators);
   const pTokenPart = {
      type: EXTERNAL_ID,
   };

   usp.checkForPERef(source, 'idType', pTokenPart, (result) => {
      if (result.leftOff) {
         deliverPTokenPart(result);
      } else {
         deliverPTokenPart();
      }
   }, () => {
      source.extract('peekWord', allTerminators, (sToken) => {
         const capitalType = sToken && sToken.text.toLocaleUpperCase();

         if (!sToken || ALLOWED_TYPES.indexOf(capitalType) === -1) {
            deliverPTokenPart();
            return;
         }

         source.extractToObject('word', allTerminators, pTokenPart, 'idType');
         source.extractToObject('space', pTokenPart, 'postIdTypeSpace');

         if (capitalType === 'PUBLIC') {
            parsePublic(source, pTokenPart, allTerminators, deliverPTokenPart);
         } else {
            parseSystem(source, allTerminators, pTokenPart, deliverPTokenPart);
         }
      });
   });
}

function parsePublic(source, pTokenPart, allTerminators, deliverPTokenPart) {
   usp.checkForPERef(source, 'public', pTokenPart, deliverPTokenPart, () => {
      const temp = {};

      literal.parse(source, {
         pToken: temp,
      }, (gotQuoted) => {
         if (!gotQuoted) {
            deliverPTokenPart(pTokenPart);
            return;
         }

         pTokenPart.public = temp;
         source.extractToObject('space', pTokenPart, 'postPublicSpace');

         parseSystem(source, allTerminators, pTokenPart, deliverPTokenPart);
      });
   });
}

function parseSystem(source, allTerminators, pTokenPart, deliverPTokenPart) {
   usp.checkForPERef(source, 'system', pTokenPart, deliverPTokenPart, () => {
      source.extract('peekWord', allTerminators, (nData) => {
         if (nData && nData.text.toLocaleUpperCase() === 'NDATA') {
            deliverPTokenPart(pTokenPart);
            return;
         }

         const temp = {};
         literal.parse(source, {
            pToken: temp,
         }, (gotLiteral) => {
            if (gotLiteral) {
               pTokenPart.system = temp;
            }

            deliverPTokenPart(pTokenPart);
         });
      });
   });
}

function completeParse(externalId) {
   const incomplete = externalId.incomplete || [];
   if (incomplete.length === 0) {
      delete externalId.incomplete;
   }

   const unexpandedRef = incomplete.filter((item) => (item.type === entityReference.PTOKEN));
   if (unexpandedRef.length === 0) {
      return;
   }

   usp.fillInProperties(externalId, externalId.leftOff || 'idType', externalId.incomplete, [
      { id: 'idType', type: 'word' },
      { id: 'postIdTypeSpace', type: 'space', required: true },
      { id: 'public', type: 'literal' },
      { id: 'postPublicSpace', type: 'space', required: true },
      { id: 'system', type: 'literal' },
   ]);

   if (incomplete === 0) {
      delete externalId.incomplete;
   }
}

/**********************************************************************\
 checkWellFormed() does a well formed check on the pTokenPart value, and
 reports any error through the error collector.

 PARAM
   pTokenPart: A PToken-compatible externalId as produced, above
   ec: An ErrorCollector instance.
\**********************************************************************/

function checkWellFormed(pTokenPart, ec, entityMetaData) {
   if (!pTokenPart || pTokenPart.incomplete) {
      return;
   }

   ec.setPos(pTokenPart.idType);
   const typeText = textOrBlank(pTokenPart.idType);
   const capitalType = typeText.toLocaleUpperCase();
   ec.check(ALLOWED_TYPES.indexOf(capitalType) === -1, WFEID.EXTERNALID_UNKNOWN, [ typeText ]);
   ec.check(typeText !== capitalType, WFEID.EXTERNALID_INVALID_CASE, [ capitalType, typeText ]);

   ec.setPos(pTokenPart.postIdTypeSpace);
   ec.check(!pTokenPart.postIdTypeSpace, WFEID.EXTERNALID_IDTYPE_NO_SPACE);

   if (capitalType === 'PUBLIC') {
      literal.checkWellFormed(pTokenPart.public, ec, entityMetaData, WFEID.NOUN_EXTERNALID_PUBLIC, () => {
         if (!pTokenPart.public || !pTokenPart.public.value) {
            return;
         }
         const match = PUBID_CHARS.exec(pTokenPart.public.value[0].text);
         ec.check(!match || match[0] !== pTokenPart.public.value[0].text, WFEID.EXTERNALID_PUBLIC_INVALID_CHARS,
                  [ pTokenPart.public.value[0].text[match[0].length] ]);
      });
   }

   if (capitalType === 'SYSTEM' || (pTokenPart.system && (pTokenPart.system.openQuote || pTokenPart.system.value))) {
      if (pTokenPart.public && pTokenPart.public.value) {
         ec.setPos(pTokenPart.postPublicSpace);
         ec.check(!pTokenPart.postPublicSpace, WFEID.EXTERNALID_SYSTEM_NO_LEADING_SPACE);
      }

      literal.checkWellFormed(pTokenPart.system, ec, entityMetaData, WFEID.NOUN_EXTERNALID_SYSTEM);
   }
}

/**********************************************************************\
 makeEntityLocation() converts a pTokenPart value into a form that
 can be inserted into a token.
\**********************************************************************/

function makeEntityLocation(pTokenPart) {
   if (!pTokenPart || pTokenPart.incomplete) {
      return;
   }

   const value = (pTokenPart.system && pTokenPart.system.value) ?
      pTokenPart.system.value[0].text.text : undefined;
   const publicValue = (pTokenPart.public && pTokenPart.public.value) ?
      pTokenPart.public.value[0].text.text : undefined;

   return new EntityLocation(value, publicValue);
}

function getSTokens(pTokenPart) {
   let results = [];
   if (!pTokenPart) {
      return [];
   }

   results.push(pTokenPart.idType);
   results.push(pTokenPart.postIdTypeSpace);

   results = results.concat(literal.getSTokens(pTokenPart.public));
   results.push(pTokenPart.postPublicSpace);
   results = results.concat(literal.getSTokens(pTokenPart.system));

   return results.filter(item => item);
}

const externalId = {
   PTYPE: EXTERNAL_ID,
   parse,
   completeParse,
   getSTokens,
   checkWellFormed,
   makeEntityLocation,
};

export default externalId;
