/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from '../../basic/index';
import { ErrorCollector, WellFormedError } from '../../error';
import { SToken, STokenSource } from '../../sToken';

import entityReference from '../entityReference';
import text, { TextPToken, TextXToken } from '../text';
import misc from './misc.js';
import literalValue, {
   LiteralValuePToken,
   Terminators as LiteralValueTerminators,
   LiteralValueXToken,
} from './literalValue';

const WFEID = WellFormedError.ID;

type DeliverFound = (foundLiteral: boolean) => void;
type ParseOptions = {
   pToken: any,
   peRef?: boolean,
   geRef?: boolean,
};
type LiteralPToken = {
   openQuote?: SToken,
   value: LiteralValuePToken,
   closeQuote?: SToken,
   [other: string]: any,
};

// <typeHack>
   function isTextXToken(item: any): item is TextXToken {
      return item.type === text.XTYPE;
   }
// </typeHack>

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
   value: Array<text.PToken|entityReference.PToken|entityReference.ParamPToken>
   closeQuote: SToken|void
\**********************************************************************/

function parse(source: STokenSource, options: ParseOptions, done: DeliverFound): void {
   const pToken = options.pToken;

   source.extract('peekChar', (quoteSToken) => {
      if (!quoteSToken || (quoteSToken.str !== '"' && quoteSToken.str !== '\'')) {
         done(false);
         return;
      }

      source.extractToObject('char', pToken, 'openQuote');

      const terminators: LiteralValueTerminators = [ quoteSToken.str ];

      if (options.peRef) {
         terminators.push('%');
      }

      if (options.geRef) {
         terminators.push('&');
      }

      literalValue.parse(source, terminators, (valueArray) => {
         pToken.value = valueArray;
         source.extract('match', quoteSToken.str, (closeSToken) => {
            if (pToken.value.length === 0) {
               const textPToken = new text.PToken();
               const newRange = quoteSToken.firstRange.clone();
               newRange.startIndex = newRange.endIndex;
               newRange.startRow = newRange.endRow;
               newRange.startColumn = newRange.endColumn;

               textPToken.text = new SToken('', '', newRange);

               pToken.value.push(textPToken);
            }

            pToken.closeQuote = closeSToken;

            done(true); // may not be gramatically correct, but we at least think we started to get something
         });
      });
   });
}

function checkWellFormed(pTokenPart: LiteralPToken, ec: ErrorCollector, entityMetaData: EntityMetaData, type: string, checkValue?: () => void) {
   const pToken = pTokenPart || {};

   ec.setPos(pToken.openQuote);
   ec.check(!pToken.openQuote, WFEID.LITERAL_NO_OPEN_QUOTE, [ type ]);

   const pieces = pToken.value || [];
   literalValue.checkWellFormed(pieces, ec, entityMetaData);

   if (checkValue) {
      checkValue();
   }

   ec.setPos(pToken.closeQuote);
   ec.check(!pToken.closeQuote, WFEID.LITERAL_NO_CLOSE_QUOTE, [ type ]);
}

function makeTokenCompatible(pToken?: LiteralPToken): LiteralValueXToken | void {
   const pieces = pToken ? pToken.value || [] : [];

   const result = literalValue.makeXTokenCompatible(pieces);

   return result.length === 0 ? undefined : result;
}

function makeOneTokenCompatible(pToken: LiteralPToken): string | void {
   const result = literalValue.makeXTokenCompatible(pToken.value);

   if (result.length === 0) {
      return;
   } else {
      const firstItem = result[0];

      if (isTextXToken(firstItem)) {
         return firstItem.text;
      }
   }
}

function getSTokens(pToken: LiteralPToken | void): Array<SToken> {
   let results: Array<SToken> = [];

   if (!pToken) {
      return results;
   }

   if (pToken.openQuote) {
      results.push(pToken.openQuote);
   }

   results = results.concat(literalValue.getSTokens(pToken.value || []));

   if (pToken.closeQuote) {
      results.push(pToken.closeQuote);
   }

   return results;
}

const literal = {
   parse,
   checkWellFormed,
   makeTokenCompatible,
   makeOneTokenCompatible,
   getSTokens,
};

export default literal;
export {
   LiteralPToken,
   LiteralValuePToken,
   LiteralValueXToken,
};
