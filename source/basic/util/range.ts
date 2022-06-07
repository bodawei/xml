/* Copyright ® 2016-2022 by 柏大衛. All rights reserved. */

import { EntityId } from '../token/entityId';

import { Offset } from './offset';

function isRange(item: Range | Offset | EntityId): item is Range {
   return 'entityId' in item && 'startIndex' in item;
}

function isOffset(item: Range | Offset | EntityId): item is Offset {
   return 'entityId' in item && 'index' in item;
}

/**********************************************************************\
 A range is used to record the start and end of a range of characters
 in an entity.
 It tracks which location (by way of an EntityId), plus the start
 and end index, row and column within the entity.

 It is important to note:
   - index is a count of characters since the start of the entity.
      \r\n counts as two characters
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

   constructor(other: Range);
   constructor(offset: Offset);
   constructor(
      location: EntityId,
      index?: number,
      row?: number,
      column?: number,
      endIndex?: number,
      endRow?: number,
      endColumn?: number,
   );
   constructor(
      various: Offset | EntityId | Range,
      index = 0,
      row = 0,
      column = 0,
      endIndex = 0,
      endRow = 0,
      endColumn = 0,
   ) {
      if (isRange(various)) {
         this.entityId = new EntityId(various.entityId.systemId, various.entityId.publicId);
         this.startIndex = various.startIndex;
         this.startRow = various.startRow;
         this.startColumn = various.startColumn;
         this.endIndex = various.endIndex;
         this.endRow = various.endRow;
         this.endColumn = various.endColumn;
      } else if (isOffset(various)) {
         this.entityId = new EntityId(various.entityId.systemId, various.entityId.publicId);
         this.startIndex = various.index;
         this.startRow = various.row;
         this.startColumn = various.column;
         this.endIndex = various.index;
         this.endRow = various.row;
         this.endColumn = various.column;
      } else {
         this.entityId = new EntityId(various.systemId, various.publicId);
         this.startIndex = index || 0;
         this.startRow = row || 0;
         this.startColumn = column || 0;
         this.endIndex = endIndex || 0;
         this.endRow = endRow || 0;
         this.endColumn = endColumn || 0;
      }
   }
}

export { Range };
