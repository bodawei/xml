/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ExternalId, TEXT_PTOKEN, CHARREF_PTOKEN } from 'token';
import { LiteralValuePToken } from 'source/token/common/literal';

const ENTITY_ID = 'ENTITY_ID';

/*
 * Carries the textual representation of the identifier of an
 * entity. This can be thought of as a condensed version of
 * an ExternalId. However, its role in the system is either
 * as a piece of metadata describing the location of the
 * document entity, or a transient bit of data used to
 * identify an entity during the expansion process.
 */
class EntityId {
   readonly type: typeof ENTITY_ID = ENTITY_ID;
   readonly systemId: string;
   readonly publicId?: string;

   constructor(systemId?: string, publicId?: string) {
      this.systemId = systemId || './index.xml';
      this.publicId = publicId;
   }
}

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

function externalIdToEntityId(externalId: ExternalId): EntityId {
   return new EntityId(
      valueToString(externalId.system?.value),
      valueToString(externalId.public?.value),
   );
}

export { ENTITY_ID, EntityId, externalIdToEntityId };
