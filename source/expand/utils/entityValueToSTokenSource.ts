/* Copyright ® 2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityId, ConformanceVersion } from 'basic';
import { defaultExtractors } from 'extractor';
import { STokenSource } from 'sToken';
import { CHARREF_PTOKEN, TEXT_PTOKEN, EntityValuePToken } from 'token';

/*
 * Given an EntityValuePToken, extract all the textual information in it and insert that
 * into an STokenSource, returning that.
 */
function entityValueToSTokenSource(
   entityValue: EntityValuePToken,
   entityId: EntityId,
   confVer: ConformanceVersion,
): STokenSource {
   const source = new STokenSource(defaultExtractors, entityId, confVer);

   for (const element of entityValue) {
      switch (element.type) {
         case CHARREF_PTOKEN:
            source.addText(element.char);
            break;
         case TEXT_PTOKEN:
            source.addText(element.text.str);
            break;
      }
   }

   source.endText();

   return source;
}

export { entityValueToSTokenSource };
