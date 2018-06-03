/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import EntityLocation from './EntityLocation';
import Offset from './Offset.js';

/**********************************************************************\
 A range is used to record the start and end of a range of characters
 in an entity.
 It tracks which location (by way of an EntityLocation), plus the start
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
   public location?: EntityLocation;
   public startIndex: number;
   public startRow: number;
   public startColumn: number;
   public endIndex: number;
   public endRow: number;
   public endColumn: number;

   constructor(location: EntityLocation | void,
      index: number = 0, row: number = 0, column: number = 0,
      endIndex: number = 0, endRow: number = 0, endColumn: number = 0) {

      if (location instanceof Offset) {
         this.location = location.location;
         this.startIndex = location.index;
         this.startRow = location.row;
         this.startColumn = location.column;
         this.endIndex = location.index;
         this.endRow = location.row;
         this.endColumn = location.column;
         return;
      }

      this.location = location;
      this.startIndex = index || 0;
      this.startRow = row || 0;
      this.startColumn = column || 0;
      this.endIndex = endIndex || 0;
      this.endRow = endRow || 0;
      this.endColumn = endColumn || 0;
   }

   clone() {
      return new Range(this.location, this.startIndex, this.startRow, this.startColumn,
         this.endIndex, this.endRow, this.endColumn);
   }

   toString() {
      return JSON.stringify(this);
   }

   getStartOffset() {
      return new Offset(this.location, this.startIndex, this.startRow, this.startColumn);
   }

   getEndOffset() {
      return new Offset(this.location, this.endIndex, this.endRow, this.endColumn);
   }

   equals(other: Range) {
      let locationsEqual = false;

      if (!this.location && !other.location) {
         locationsEqual = true;
      } else if (!this.location) {
         locationsEqual = false;
      } else {
         locationsEqual = this.location.equals(other.location);
      }

      return locationsEqual &&
         this.startIndex === other.startIndex &&
         this.startRow === other.startRow &&
         this.startColumn === other.startColumn &&
         this.endIndex === other.endIndex &&
         this.endRow === other.endRow &&
         this.endColumn === other.endColumn;
   }
}

export default Range;
