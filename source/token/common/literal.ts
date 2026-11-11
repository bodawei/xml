/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'basic';

import literalValue, {
   LiteralValuePToken,
   Terminators as LiteralValueTerminators,
} from './literalValue';

type DeliverPToken = (foundLiteral?: LiteralPToken) => void;
type ParseOptions = {
   pToken: any;
   peRef?: boolean;
   geRef?: boolean;
   charRef?: boolean;
};
interface LiteralPToken {
   openQuote?: SToken;
   value: LiteralValuePToken;
   closeQuote?: SToken;
   [other: string]: any;
}

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
   value: Array<text.PToken|GeneralEntityReferencePToken|ParameterEntityReferencePToken>
   closeQuote: SToken|void
\**********************************************************************/

// @@@ We need a version of this taht returns EntityValuePToken...
function parse(source: STokenSource, options: ParseOptions | undefined, done: DeliverPToken): void {
   const pToken = options?.pToken || {};

   source.extract('peekChar', (quoteSToken) => {
      if (!quoteSToken || (quoteSToken.str !== '"' && quoteSToken.str !== "'")) {
         done();
         return;
      }

      source.extractToObject('char', pToken, 'openQuote');

      const terminators: LiteralValueTerminators = [quoteSToken.str];

      if (options?.peRef) {
         terminators.push('%');
      }

      if (options?.geRef) {
         terminators.push('&');
      }

      if (options?.charRef) {
         terminators.push('&#');
      }

      literalValue.parse(source, terminators, (valueArray) => {
         pToken.value = valueArray;
         source.extract('match', quoteSToken.str, (closeSToken) => {
            pToken.closeQuote = closeSToken;

            done(pToken); // may not be gramatically correct, but we at least think we started to get something
         });
      });
   });
}

const parseLiteral = parse;

const literal = {
   parse,
   parseLiteral,
};

export default literal;
export { parseLiteral, LiteralPToken, LiteralValuePToken };
