/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../../error';
import { LToken } from '../../lToken';

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
      source.extractToObject('all', [ quoteLToken.text ], parsed, prefix + 'Value');

      source.extract('match', quoteLToken.text, (closeLToken) => {
         if (!parsed[prefix + 'Value']) {
            const newRange = quoteLToken.range[0].clone();
            newRange.startIndex = newRange.endIndex;
            newRange.startRow = newRange.endRow;
            newRange.startColumn = newRange.endColumn;
            parsed[prefix + 'Value'] = [ new LToken('', '', newRange) ];
         } else {
            parsed[prefix + 'Value'] = [ parsed[prefix + 'Value'] ];
         }
         parsed[prefix + 'CloseQuote'] = closeLToken;
         done(true); // may not be gramatically correct, but we at least think we started to get something
      });
   });
}

function checkWellFormed(prefix, parsed, ec, entityMetaData, type, checkValue) {
   ec.setPos(parsed[prefix + 'OpenQuote']);
   ec.check(!parsed[prefix + 'OpenQuote'], WFEID.QUOTEDVALUE_NO_OPEN_QUOTE, [ type ]);

   const values = parsed[prefix + 'Value'] || [];
   for (let index = 0; index < values.length; index++) {
      ec.setPos(parsed[prefix + 'Value'][index]);
      misc.checkWellFormedText(parsed[prefix + 'Value'][index], ec, entityMetaData);
   }
   if (checkValue) {
      checkValue();
   }

   ec.setPos(parsed[prefix + 'CloseQuote']);
   ec.check(!parsed[prefix + 'CloseQuote'], WFEID.QUOTEDVALUE_NO_CLOSE_QUOTE, [ type ]);
}

function makeTokenCompatible(prefix, parsed) {
   const value = parsed[prefix + 'Value'] ?
      [ new text.Token(parsed[prefix + 'Value'][0].text, parsed[prefix + 'Value']) ] : undefined;

   return value;
}

function makeOneTokenCompatible(prefix, parsed) {
   return parsed[prefix + 'Value'] ? parsed[prefix + 'Value'][0].text : undefined;
}

function appendLTokens(prefix, results, parsed) {
   if (!parsed) {
      return;
   }
   pushNonBottom(results, parsed[prefix + 'OpenQuote']);

   const values = parsed[prefix + 'Value'] || [];

   for (let index = 0; index < values.length; index++) {
      pushNonBottom(results, parsed[prefix + 'Value'][index]);
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
