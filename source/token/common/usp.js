/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import entityReference from '../entityReference.js';
import * as literal from './literal.js';

const TERMINATORS = [ '>', '"', '\'', '%' ];

/**********************************************************************\
 Unidentified Syntax Pieces
 This is used to extract certain items from an input stream. The
 intended use is after encountering a parameter entity reference in
 a declaration, anything that comes after it may be impossible to
 accurately assign to the other fields in the relevant PToken until
 we have expanded the parameter entity reference. When this happens
 we know that certain things can legitimately come after the PERef
 and before the closing ">". This includes:
   - space-terminated strings (words)
   - runs of space
   - literals
   - other parameter entity references
 This takes a set of options to specify what is potentially allowable,
 and will read in as many of the allowable things as possible until it
 encounters a ">" or something it is not allowed to recognize. It will
 then pass an array of all the bits it has found STokens, PTokens or
 PToken parts (in the case of literals).
\**********************************************************************/

function parse(source, options = {}, deliverUsp) {
   const result = [];

   extract(source, result, options, deliverUsp);
}

function extract(source, result, options, deliverUsp) {
   source.extract('space', (sToken) => {
      if (sToken) {
         result.push({ type: 'space', item: sToken });
      }

      source.extract('peekChar', (sToken) => {
         if (!sToken) {
            deliverUsp(result);
         } else {
            handleChar(sToken, source, result, options, deliverUsp);
         }
      });
   });
}

function handleChar(sToken, source, result, options, deliverUsp) {
   switch (sToken.text) {
      case '>':
         deliverUsp(result);
         break;
      case '%':
         entityReference.paramParse(source, (pToken) => {
            result.push({ type: 'peref', item: pToken });
            extract(source, result, options, deliverUsp);
         });
         break;
      case '"':
      case '\'':
         const container = {};
         literal.parse(source, { pToken: container }, () => {
            result.push({ type: 'literal', item: container });
            extract(source, result, options, deliverUsp);
         });
         break;
      default:
         source.extract('word', TERMINATORS, (sToken) => {
            result.push({ type: 'word', item: sToken });
            extract(source, result, options, deliverUsp);
         });
         break;
   }
}

export {
   parse,
};
