/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { EntityLocation } from '../../basic';
import { WellFormedError } from '../../error';

import * as literal from './literal.js';
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
const PUBLIC_PREFIX = 'public';
const SYSTEM_PREFIX = 'system';
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

   checkForPERef(source, 'idType', pTokenPart, (result) => {
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

function checkForPERef(source, forValue, pTokenPart, deliverPTokenPart, otherwise) {
   source.extract('peekChar', (sToken) => {
      if (!sToken) {
         deliverPTokenPart(pTokenPart);
      } else if (sToken.text === '%') {
         usp.parse(source, {}, (pieces) => {
            pTokenPart.leftOff = forValue;
            pTokenPart.incomplete = pieces;
            deliverPTokenPart(pTokenPart);
         });
      } else {
         otherwise();
      }
   });
}

function parsePublic(source, pTokenPart, allTerminators, deliverPTokenPart) {
   checkForPERef(source, 'public', pTokenPart, deliverPTokenPart, () => {
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
   checkForPERef(source, 'system', pTokenPart, deliverPTokenPart, () => {
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

// function normalizeTokenChunks(chunks) {
//    const newChunks = [];

//    for (let index = 0; index < chunks.length; index++) {
//       const prevChunk = chunks[index - 1] || {};
//       const chunk = chunks[index];
//       const nextChunk = chunks[index + 1] || {};

//       switch (chunk.type) {
//          case 'pestart':
//          case 'peend':
//             if (prevChunk.type !== 'space' && nextChunk.type !== 'space') {
//                newChunks.push({
//                   type: 'space',
//                   optional: true,
//                   item: new SToken(' ' , ' ', new Range(undefined, );
//                });
//             } else if (prevChunk.type === 'space' && nextChunk.type === 'space') {
//                // mrge
//             }
//             break;
//          default:
//             newChunks.push(chunk);
//             break;
//       }
//    }

//    return newChunks;
// }

// function completeParse(externalId) {
//    let incompleteArray = externalId.incomplete || [];
//    let leftOff = externalId.leftOff || 'idType';
//    let unexpandedRefs = incompleteArray.filter((item) => (item.type === 'peref'));

//    if (unexpandedRefs.length !== 0) {
//       return;
//    }

//    incompleteArray = normalizeTokenChunks(incompleteArray);

//    doit(externalId, incompleteArray, [
//       [ 'idType', 'word' ], // don't we need to validate that it is legal?
//       [ 'postIdTypeSpace', 'space', true ],
//       [ 'public', 'literal' ],
//       [ 'postPublicSpace', 'space', true ],
//       [ 'system', 'literal' ],
//    ]);

//    if (incompleteArray.length === 0) {
//       delete externalId.incomplete;
//    }

//    function doit(pToken, tokenChunks, sTokenDescriptors) {
//       let found = false;
//       if (!pToken.leftOff) {
//          found = true;
//       }

//       let prev;
//       sTokenDescriptors.forEach((descriptor) => {
//          if (descriptor[0] === pToken.leftOff) {
//             found = true;
//             if (incompleteArray[0].type === 'optional-space' || incompleteArray[0].type === 'space' && !pToken[prevDescriptor.name]) {
//                pToken[prevDescriptor.name] = incompleteArray.shift().item;
//             } else if (incompleteArray[0].type === 'space' && pToken[prevDescriptor.name]) {
//                // merge
//             } else if (incompleteArray[0].type === 'optional-space') {
//                incompleteArray.shift();
//             }
//          }

//          if (descriptor.type === incompleteArray[0].type) {
//             pToken[descriptor.name] = incompleteArray.shift().item;
//          }

//          prev = descriptor;
//       });
//    }
// }

/**********************************************************************\
 checkWellFormed() does a well formed check on the pTokenPart value, and
 reports any error through the error collector.

 PARAM
   pTokenPart: A PToken-compatible externalId as produced, above
   ec: An ErrorCollector instance.
\**********************************************************************/

function checkWellFormed(pTokenPart, ec, entityMetaData) {
   if (!pTokenPart) {
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
   if (!pTokenPart) {
      return;
   }

   const value = (pTokenPart.system && pTokenPart.system.value) ? pTokenPart.system.value[0].text : undefined;
   const publicValue = (pTokenPart.public && pTokenPart.public.value) ? pTokenPart.public.value[0].text : undefined;

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

export {
   EXTERNAL_ID as PTYPE,
   parse,
   getSTokens,
   checkWellFormed,
   makeEntityLocation,
};
