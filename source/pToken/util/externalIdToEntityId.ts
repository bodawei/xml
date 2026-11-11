/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { EntityId } from 'basic';
import { CHARREF_PTOKEN, TEXT_PTOKEN } from 'pToken';

//ick
import { LiteralValuePToken } from '../../token/common/literal';
import { ExternalIdP } from '../common/externalId';

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
         default:
         // ignore the others
      }
   }

   return pieces.join('');
}

function externalIdToEntityId(externalId: ExternalIdP | undefined): EntityId {
   return new EntityId(
      valueToString(externalId?.system?.value),
      valueToString(externalId?.public?.value),
   );
}

export { externalIdToEntityId };
