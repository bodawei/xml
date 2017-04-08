/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/*
 * Xm
 */
function checkNameRecommendations(nameText, entityMd, v1R5Warning, otherWarning) {
   if (!nameText) {
      return;
   }
   const isV1R5 = entityMd.isVersion1dot0 && entityMd.revision === 5;

   if (isV1R5 && nameText.substring(0, 4) === 'xml-') {
      return v1R5Warning;
   } else if (!isV1R5 && nameText.substring(0, 3).toLocaleLowerCase() === 'xml') {
      return otherWarning;
   }

   return;
}

module.exports = {
   checkNameRecommendations
};
