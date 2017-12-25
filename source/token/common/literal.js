/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../../error';
import { SToken } from '../../sToken';

import entityReference from '../entityReference.js';
import * as text from '../text.js';
import * as misc from './misc.js';

const WFEID = WellFormedError.ID;

/**********************************************************************\
 The literal namespace has utility routines for dealing with
 values of the form "[^"]*" or '[^']*'.

 This is meant to be called from contexts that have already validated
 that the next character is a quote (e.g. through a peekChar)

 This returns true to the done() parameter, unless the next character
 in the source is not a quote.

 If true is returned, then this modifies the options.pToken value.
 It does so by adding these properties to it:
   openQuote: SToken
   value: Array<SToken|entityReference.PToken|entityReference.ParamPToken>
   closeQuote: SToken|void
\**********************************************************************/

function parse(source, options, done) {
   const pToken = options.pToken;

   source.extract('peekChar', (quoteSToken) => {
      if (!quoteSToken || (quoteSToken.text !== '"' && quoteSToken.text !== '\'')) {
         done(false);
         return;
      }

      source.extractToObject('char', pToken, 'openQuote');

      const terminators = [ quoteSToken.text ];

      if (options.peRef) {
         terminators.push('%');
      }

      if (options.geRef) {
         terminators.push('&');
      }

      getRest(source, terminators, (valueArray) => {
         pToken.value = valueArray;
         source.extract('match', quoteSToken.text, (closeSToken) => {
            if (pToken.value.length === 0) {
               const newRange = quoteSToken.range[0].clone();
               newRange.startIndex = newRange.endIndex;
               newRange.startRow = newRange.endRow;
               newRange.startColumn = newRange.endColumn;
               pToken.value.push(new SToken('', '', newRange));
            }

            pToken.closeQuote = closeSToken;

            done(true); // may not be gramatically correct, but we at least think we started to get something
         });
      });
   });
}

/*
 * This gets the next portion of the literal, which will, optionally, be an SToken
 * followed by an optional entity reference. If neither is found, we're either
 * at EOF, or have peeked the closing quote.
 *
 * It returns the final Array<SToken|PERefPToken|GERefPToken> through the
 * callback, which is built up on the unwind from the recursive call.
 */
function getRest(source, terminators, literalDone) {
   const container = {};

   source.extractToObject('all', terminators, container, 'sToken');
   source.extract('peekChar', (char) => {
      const currentPortion = container.sToken ? [ container.sToken ] : [];
      if (!char) {
         literalDone(currentPortion);
         return;
      }

      function handleRef(refPToken) {
         getRest(source, terminators, (rest) => {
            rest.unshift(refPToken);
            literalDone(currentPortion.concat(rest));
         });
      }

      switch (char.text[0]) {
         case '"':
         case '\'':
            literalDone(currentPortion);
            break;
         case '%':
            entityReference.paramParse(source, handleRef);
            break;
         case '&':
            entityReference.parse(source, handleRef);
            break;
      }
   });
}

function checkWellFormed(pTokenPart, ec, entityMetaData, type, checkValue) {
   const pToken = pTokenPart || {};

   ec.setPos(pToken.openQuote);
   ec.check(!pToken.openQuote, WFEID.LITERAL_NO_OPEN_QUOTE, [ type ]);

   const pieces = pToken.value || [];
   for (let index = 0; index < pieces.length; index++) {
      const item = pieces[index];
      if (item.type) {
         entityReference.checkWellFormed(item, ec, entityMetaData);
      } else {
         ec.setPos(item);
         misc.checkWellFormedText(item, ec, entityMetaData);
      }
   }
   if (checkValue) {
      checkValue();
   }

   ec.setPos(pToken.closeQuote);
   ec.check(!pToken.closeQuote, WFEID.LITERAL_NO_CLOSE_QUOTE, [ type ]);
}

function makeTokenCompatible(pToken) {
   const value = [];
   const pieces = pToken ? pToken.value || [] : [];

   for (let index = 0; index < pieces.length; index++) {
      const item = pieces[index];
      if (item.type) {
         value.push(entityReference.pTokenToXToken(item));
      } else {
         value.push(new text.XToken(item.text, { text: item }));
      }
   }

   return value.length === 0 ? undefined : value;
}

function makeOneTokenCompatible(pToken) {
   return (pToken && pToken.value) ? pToken.value[0].text : undefined;
}

function getSTokens(pToken) {
   const results = [];

   if (!pToken) {
      return results;
   }

   results.push(pToken.openQuote);

   const pieces = pToken.value || [];

   for (let index = 0; index < pieces.length; index++) {
      const item = pieces[index];
      if (!item.text) {
         if (item.pToken) {
            item.pToken.forEach(sToken => {
               results.push(sToken);
            });
         }
      } else {
         results.push(item);
      }
   }

   results.push(pToken.closeQuote);

   return results.filter(item => item);
}

export {
   parse,
   checkWellFormed,
   makeTokenCompatible,
   makeOneTokenCompatible,
   getSTokens,
};
