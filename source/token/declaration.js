/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import docTypeStart from './docTypeStart.js';

const DECLARATION = 'DECLARATION';

/**********************************************************************\
\**********************************************************************/

function parse(source, openChunk, deliverParsed) {
   const results = {
      openChunk: openChunk,
   };
   source.extractToObject('space', undefined, results, 'postOpenSpaceChunk');
   source.extractToObject('word', [ '>' ], results, 'declTypeChunk');

   source.extract('space', (chunk) => {
      results.postDeclTypeSpaceChunk = chunk;
      if (results.declTypeChunk && results.declTypeChunk.text === 'DOCTYPE') {
         docTypeStart.parse(source, results, deliverParsed);
      }
   });
}

function checkWellFormed() {
}

function makeToken() {
}

module.exports = {
   TYPE: DECLARATION,
   parse,
   checkWellFormed,
   makeToken,
};
