/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { EntityId } from './entityId';

/**********************************************************************\
 An Offset is used to track a particular index, and row/column
 position in an entity identified by an EntityId.
\**********************************************************************/

class Offset {
   public readonly entityId: EntityId;
   public readonly index: number;
   public readonly row: number;
   public readonly column: number;

   constructor(location: EntityId | EntityId, index = 0, row = 0, column = 0) {
      this.entityId = new EntityId(location.systemId, location.publicId);
      this.index = index;
      this.row = row;
      this.column = column;
   }

   clone(): Offset {
      return new Offset(this.entityId, this.index, this.row, this.column);
   }

   equals(other: Offset): boolean {
      return (
         this.entityId.systemId === other.entityId.systemId &&
         this.entityId.publicId === other.entityId.publicId &&
         this.index === other.index &&
         this.row === other.row &&
         this.column === other.column
      );
   }
}

export default Offset;
