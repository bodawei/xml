/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import xmlDeclaration from './xmlDeclaration.js';

const PROCESSING_INSTRUCTION = 'PROCESSING_INSTRUCTION';

/**********************************************************************\
\**********************************************************************/

function parse(source, startLToken, deliverParsed) {
   const results = {
      openLToken: startLToken,
   };

   source.extractToObject('space', results, 'postOpenSpaceLToken');
   source.extractToObject('word', [ '?>' ], results, 'targetLToken');

   source.extract('space', (lToken) => {
      results.postTargetSpaceLToken = lToken;

      if (results.targetLToken && results.targetLToken.text.toLocaleLowerCase() === 'xml') {
         xmlDeclaration.parse(source, results, deliverParsed);
      } else {
         results.type = PROCESSING_INSTRUCTION;
         source.extractToObject('all', [ '?>' ], results, 'instructionLToken');
         source.extract('match', '?>', (lToken) => {
            results.closeLToken = lToken;
            deliverParsed(results);
         });
      }
   });
}

module.exports = {
   TYPE: PROCESSING_INSTRUCTION,
   parse,
};
