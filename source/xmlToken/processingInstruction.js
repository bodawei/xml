/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import error from '../error';

import xmlDeclaration from './xmlDeclaration.js';

const PROCESSING_INSTRUCTION = 'PROCESSING_INSTRUCTION';

/**********************************************************************\
\**********************************************************************/

function parse(source, startChunk, deliverParsed) {
   const results = {
      openChunk: startChunk,
   };

   source.extractToObject('space', undefined, results, 'postOpenSpaceChunk');
   source.extractToObject('word', [ '?>' ], results, 'targetChunk');

   source.extract('space', (chunk) => {
      results.postTargetSpaceChunk = chunk;

      if (results.targetChunk && results.targetChunk.text.toLocaleLowerCase() === 'xml') {
         xmlDeclaration.parse(source, results, deliverParsed);
      } else {
         results.type = PROCESSING_INSTRUCTION;
         source.extractToObject('all', [ '?>' ], results, 'instructionChunk');
         source.extract('match', '?>', (chunk) => {
            results.closeChunk = chunk;
            deliverParsed(results);
         });
      }
   });
}

function checkWellFormed(parsed, isDocEntity, version, revision) {
}

function makeToken(parsed) {
}

module.exports = {
   TYPE: PROCESSING_INSTRUCTION,
   parse,
   checkWellFormed,
   makeToken,
};
