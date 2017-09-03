/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { XmlWarning } from '../error';

/**********************************************************************\
 checkWellFormedNameRecommendation() does a check whether a name starts
 with "xml", and if that is or is not acceptable based on the entity
 version.
\**********************************************************************/

function checkWellFormedNameRecommendation(nameLToken, ec, entityMd, v1R6Warning, otherWarning) {
   if (!nameLToken) {
      return;
   }
   const isV1R6 = entityMd.isVersion1dot0 && entityMd.revision === 6;

   if (isV1R6 && nameLToken.text.substring(0, 4) === 'xml-') {
      ec.reportError(v1R6Warning, XmlWarning, [ nameLToken.text ]);
   } else if (!isV1R6 && nameLToken.text.substring(0, 3).toLocaleLowerCase() === 'xml') {
      ec.reportError(otherWarning, XmlWarning, [ nameLToken.text ]);
   }
}

export {
   checkWellFormedNameRecommendation,
};
