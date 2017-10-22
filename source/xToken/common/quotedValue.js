/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../../error';
import { LToken } from '../../lToken';

import * as entityReference from '../entityReference.js';
import * as text from '../text.js';
import * as misc from './misc.js';
import { pushNonBottom } from './util.js';

const WFEID = WellFormedError.ID;

/**********************************************************************\
 The quotedValue namespace has utility routines for dealing with
 values of the form "[^"]*" or '[^']*'.

 This is meant to be called from contexts that have already validated
 that the next character is a quote (e.g. through a peekChar)
\**********************************************************************/

function parse(source, options, done) {
   const prefix = options.prefix;
   const parsed = options.parsed;

   source.extract('peekChar', (quoteLToken) => {
      if (!quoteLToken || (quoteLToken.text !== '"' && quoteLToken.text !== '\'')) {
         done(false);
         return;
      }

      source.extractToObject('char', parsed, prefix + 'OpenQuote');

      const terminators = [ quoteLToken.text ];

      if (options.peRef) {
         terminators.push('%');
      }

      if (options.geRef) {
         terminators.push('&');
      }

      getPiece(source, terminators, (valueArray) => {
         parsed[prefix + 'Value'] = valueArray;

         source.extract('match', quoteLToken.text, (closeLToken) => {
            if (parsed[prefix + 'Value'].length === 0) {
               const newRange = quoteLToken.range[0].clone();
               newRange.startIndex = newRange.endIndex;
               newRange.startRow = newRange.endRow;
               newRange.startColumn = newRange.endColumn;
               parsed[prefix + 'Value'].push(new LToken('', '', newRange));
            }
            parsed[prefix + 'CloseQuote'] = closeLToken;
            done(true); // may not be gramatically correct, but we at least think we started to get something
         });
      });
   });
}

function getPiece(source, terminators, chunksDone) {
   const container = {};

   source.extractToObject('all', terminators, container, 'lToken');
   source.extract('peekChar', (char) => {
      if (!char) {
         chunksDone([]);
         return;
      }

      function continuation(refPToken) {
         getPiece(source, terminators, (pieces) => {
            pieces.unshift(refPToken);
            if (container.lToken) {
               pieces.unshift(container.lToken);
            }
            chunksDone(pieces);
         });
      }

      switch (char.text[0]) {
         case '"':
         case '\'':
            chunksDone(container.lToken ? [ container.lToken ] : []);
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

function checkWellFormed(prefix, parsed, ec, entityMetaData, type, checkValue) {
   ec.setPos(parsed[prefix + 'OpenQuote']);
   ec.check(!parsed[prefix + 'OpenQuote'], WFEID.QUOTEDVALUE_NO_OPEN_QUOTE, [ type ]);

   const pieces = parsed[prefix + 'Value'] || [];
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

   ec.setPos(parsed[prefix + 'CloseQuote']);
   ec.check(!parsed[prefix + 'CloseQuote'], WFEID.QUOTEDVALUE_NO_CLOSE_QUOTE, [ type ]);
}

function makeTokenCompatible(prefix, parsed) {
   const value = [];
   const pieces = parsed[prefix + 'Value'] || [];

   for (let index = 0; index < pieces.length; index++) {
      const item = pieces[index];
      if (item.type) {
         value.push(entityReference.makeToken(item));
      } else {
         value.push(new text.Token(item.text, [ item ]));
      }
   }

   return value.length === 0 ? undefined : value;
}

function makeOneTokenCompatible(prefix, parsed) {
   return parsed[prefix + 'Value'] ? parsed[prefix + 'Value'][0].text : undefined;
}

function appendLTokens(prefix, results, parsed) {
   if (!parsed) {
      return;
   }
   pushNonBottom(results, parsed[prefix + 'OpenQuote']);

   const pieces = parsed[prefix + 'Value'] || [];

   for (let index = 0; index < pieces.length; index++) {
      const item = pieces[index];
      if (!item.text) {
         if (item.lTokens) {
            item.lTokens.forEach(lToken => {
               results.push(lToken);
            });
         }
      } else {
         pushNonBottom(results, item);
      }
   }

   pushNonBottom(results, parsed[prefix + 'CloseQuote']);
}

export {
   parse,
   checkWellFormed,
   makeTokenCompatible,
   makeOneTokenCompatible,
   appendLTokens,
};
