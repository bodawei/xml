/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import docTypeStart from './docTypeStart.js';
import entityDeclaration from './entityDeclaration.js';

const GENERIC_DECLARATION = 'GENERIC_DECLARATION';

/**********************************************************************\
 declaration is a "bridge" token type. That is, it is used to identify
 a class of tokens that all start with <!.  If it finds <!NAME, then
 it will call the appropriate sub-token type (e.g. DOCTYPE, ENTITY,
 etc) and let them do the rest of the parsing. Otherwise it delivers
 the incomplete parsing
\**********************************************************************/

function parse(source, openLToken, deliverParsed) {
   const results = {
      type: GENERIC_DECLARATION,
      openLToken: openLToken,
   };
   source.extractToObject('space', undefined, results, 'postOpenSpaceLToken');
   source.extractToObject('word', [ '>' ], results, 'declTypeLToken');

   source.extract('space', (lToken) => {
      results.postDeclTypeSpaceLToken = lToken;

      if (!results.declTypeLToken) {
         deliverParsed(results);
         return;
      }

      switch (results.declTypeLToken.text) {
         case 'DOCTYPE':
            docTypeStart.parse(source, results, deliverParsed);
            break;
         case 'ENTITY':
            entityDeclaration.parse(source, results, deliverParsed);
            break;
      }
   });
}

export default {
   TYPE: GENERIC_DECLARATION,
   parse,
};
