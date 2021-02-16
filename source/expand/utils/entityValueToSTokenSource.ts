/* Copyright ® 2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityId } from 'basic';
import { defaultExtractors } from 'extractor';
import { CHARREF_PTOKEN, PARAMETER_ENTITY_REFERENCE_PTOKEN, TEXT_PTOKEN } from 'pToken';
import { STokenSource } from 'sToken';
import {
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

   // §4.4.8 ... When a parameter-entity reference is recognized in
   //    the DTD and included, its replacement text must be enlarged
   //    by the attachment of one leading and one following space
   //    (#x20) character;...
   for (const element of entityValue) {
      switch (element.type) {
         case PARAMETER_ENTITY_START_PTOKEN:
            if (depth === 0 && peRefsFormTokenBoundaries) {
               source.addPseudoSpace();
            }

            depth++;
            break;
         case PARAMETER_ENTITY_END_PTOKEN:
            depth--;
            if (depth === 0 && peRefsFormTokenBoundaries) {
               source.addPseudoSpace();
            }
            break;
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
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
