/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { EntityId } from 'basic';
import { ExternalId, TEXT_PTOKEN, CHARREF_PTOKEN } from 'token';
import { LiteralValuePToken } from 'source/token/common/literal';

function valueToString(value: LiteralValuePToken = []): string {
   const pieces = [];

   for (const piece of value) {
      switch (piece.type) {
         case TEXT_PTOKEN:
            pieces.push(piece.text.str);
            break;
         case CHARREF_PTOKEN:
            pieces.push(piece.char);
            break;
      }
   }

   return pieces.join('');
}

function externalIdToEntityId(externalId: ExternalId | undefined): EntityId {
   return new EntityId(
      valueToString(externalId?.system?.value),
      valueToString(externalId?.public?.value),
   );
}

export { externalIdToEntityId };
