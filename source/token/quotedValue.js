/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { pushNonBottom } from './util.js';

/**********************************************************************\
 The quotedValue namespace has utility routines for dealing with
 values of the form "[^"]*" or '[^']*'.

 This is meant to be called from contexts that have already validated
 that the next character is a quote (e.g. through a peekChar)
\**********************************************************************/

function parse(source, deliverParsed) {
   const parsed = {};

   source.extract('char', (lToken) => {
      parsed.openQuote = lToken;

      source.extract('all', [ lToken.text ], (lToken) => {
         parsed.value = lToken;

         source.extract('char', (lToken) => {
            parsed.closeQuote = lToken;

            deliverParsed(parsed);
         });
      });
   });
}

function checkWellFormed() {
   // When you fill this in, add to entityDeclaration.integration
}

function getChunks(results, parsed) {
   if (!parsed) {
      return;
   }
   pushNonBottom(results, parsed.openQuote);
   pushNonBottom(results, parsed.value);
   pushNonBottom(results, parsed.closeQuote);
}

export {
   parse,
   checkWellFormed,
   getChunks,
};
