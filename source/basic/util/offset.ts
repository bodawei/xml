/* Copyright ® 2016-202 by 柏大衛. All rights reserved. */

import { EntityId } from '../token/entityId';

function isOffset(item: EntityId | Offset): item is Offset {
   return 'entityId' in item;
}

class Offset {
   public readonly entityId: EntityId;

   public readonly index: number;

   public readonly row: number;

   public readonly column: number;

   constructor(other: Offset);
   constructor(location: EntityId, index?: number, row?: number, column?: number);
   constructor(locationOrOther: Offset | EntityId, index = 0, row = 0, column = 0) {
      if (isOffset(locationOrOther)) {
         this.entityId = new EntityId(
            locationOrOther.entityId.systemId,
            locationOrOther.entityId.publicId,
         );
         this.index = locationOrOther.index;
         this.row = locationOrOther.row;
         this.column = locationOrOther.column;
      } else {
         this.entityId = new EntityId(locationOrOther.systemId, locationOrOther.publicId);
         this.index = index;
         this.row = row;
         this.column = column;
      }
   }
}

export { Offset };
