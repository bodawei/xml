/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { EntityId } from '../token/entityId';
import { Offset } from './offset';

/**********************************************************************\
 A range is used to record the start and end of a range of characters
 in an entity.
 It tracks which location (by way of an EntityId), plus the start
 and end index, row and column within the entity.

 It is important to note:
   - index is a count of characters since the start of the entity.
      \r\n counts as two
   - row is the number of rows (0 origin) since the start. All line
      breaks for this version of xml start a new line (\n, \r, \r\n,
      \u02028, \u0085, \r\0085)
   - column is the index of the column in the current row.
\**********************************************************************/

class Range {
   public readonly entityId: EntityId;

   public readonly startIndex: number;

   public readonly startRow: number;

   public readonly startColumn: number;

   public readonly endIndex: number;

   public readonly endRow: number;

   public readonly endColumn: number;

   constructor(
      location: Offset | EntityId,
      index = 0,
      row = 0,
      column = 0,
      endIndex = 0,
      endRow = 0,
      endColumn = 0,
   ) {
      if (location instanceof Offset) {
         this.entityId = location.entityId;
         this.startIndex = location.index;
         this.startRow = location.row;
         this.startColumn = location.column;
         this.endIndex = location.index;
         this.endRow = location.row;
         this.endColumn = location.column;
         return;
      }

      this.entityId = location;
      this.startIndex = index || 0;
      this.startRow = row || 0;
      this.startColumn = column || 0;
      this.endIndex = endIndex || 0;
      this.endRow = endRow || 0;
      this.endColumn = endColumn || 0;
   }

   clone(): Range {
      return new Range(
         this.entityId,
         this.startIndex,
         this.startRow,
         this.startColumn,
         this.endIndex,
         this.endRow,
         this.endColumn,
      );
   }

   toString(): string {
      return JSON.stringify(this);
   }

   getStartOffset(): Offset {
      return new Offset(this.entityId, this.startIndex, this.startRow, this.startColumn);
   }

   getEndOffset(): Offset {
      return new Offset(this.entityId, this.endIndex, this.endRow, this.endColumn);
   }

   equals(other: Range): boolean {
      return (
         this.entityId.systemId === other.entityId.systemId &&
         this.entityId.publicId === other.entityId.publicId &&
         this.startIndex === other.startIndex &&
         this.startRow === other.startRow &&
         this.startColumn === other.startColumn &&
         this.endIndex === other.endIndex &&
         this.endRow === other.endRow &&
         this.endColumn === other.endColumn
      );
   }
}

export { Range };
