/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import * as docTypeStart from './docTypeStart.js';
import * as entityDeclaration from './entityDeclaration.js';

/**********************************************************************\
 The declaration namespace contains a "bridge" parser which will
 start parsing a declaration (<!) far enough to determine what kind
 of declaration this is, and then hands it off to the appropriate
 other parsers.
\**********************************************************************/

const GENERICDECL = 'GENERICDECL';

function parse(source, openLToken, deliverParsed) {
   const results = {
      type: GENERICDECL,
      open: openLToken,
   };
   source.extractToObject('space', undefined, results, 'postOpenSpace');
   source.extractToObject('word', [ '>' ], results, 'declType');

   source.extract('space', (lToken) => {
      results.postDeclTypeSpace = lToken;

      if (!results.declType) {
         deliverParsed(results);
         return;
      }

      switch (results.declType.text) {
         case 'DOCTYPE':
            docTypeStart.parse(source, results, deliverParsed);
            break;
         case 'ENTITY':
            entityDeclaration.parse(source, results, deliverParsed);
            break;
      }
   });
}

export {
   GENERICDECL as TYPE,
   parse,
};
