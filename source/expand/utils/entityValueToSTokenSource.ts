/* Copyright ® 2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityId } from 'basic';
import { defaultExtractors } from 'extractor';
import { PARAMETER_ENTITY_REFERENCE_PTOKEN, TEXT_PTOKEN } from 'pToken';
import { STokenSource } from 'sToken';
import {
   CHARREF_PTOKEN,
   EntityValuePToken,
   PARAMETER_ENTITY_START_PTOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
} from 'token';

/*
 * Given an EntityValuePToken, extract all the textual information in it and insert that
 * into an STokenSource, returning that.
 */
function entityValueToSTokenSource(
   entityValue: EntityValuePToken,
   entityId: EntityId,
   peRefsFormTokenBoundaries = false,
): STokenSource {
   const source = new STokenSource(defaultExtractors, entityId);
   let depth = 0;

   for (const element of entityValue) {
      switch (element.type) {
         case PARAMETER_ENTITY_START_PTOKEN:
            if (depth === 0 && peRefsFormTokenBoundaries) {
               source.addText(' ');
            }

            depth++;
            break;
         case PARAMETER_ENTITY_END_PTOKEN:
            depth--;
            if (depth === 0 && peRefsFormTokenBoundaries) {
               source.addText(' ');
            }
            break;
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            if (depth === 0 && peRefsFormTokenBoundaries) {
               source.addText(' ');
            }
            break;
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
