/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../../error';
import { SToken } from '../../sToken';

import * as entityReference from '../entityReference.js';
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

      getPiece(source, terminators, (valueArray) => {
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

function getPiece(source, terminators, chunksDone) {
   const container = {};

   source.extractToObject('all', terminators, container, 'sToken');
   source.extract('peekChar', (char) => {
      if (!char) {
         chunksDone([]);
         return;
      }

      function continuation(refPToken) {
         getPiece(source, terminators, (pieces) => {
            pieces.unshift(refPToken);
            if (container.sToken) {
               pieces.unshift(container.sToken);
            }
            chunksDone(pieces);
         });
      }

      switch (char.text[0]) {
         case '"':
         case '\'':
            chunksDone(container.sToken ? [ container.sToken ] : []);
            break;
         case '%':
            entityReference.paramParse(source, continuation);
            break;
         case '&':
            entityReference.parse(source, continuation);
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
         value.push(new text.XToken(item.text, [ item ]));
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
