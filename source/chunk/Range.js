/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

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

   constructor(location, index, row, column, endIndex, endRow, endColumn) {
      this.location = location;
      this.startIndex = index;
      this.startRow = row;
      this.startColumn = column;
      this.endIndex = endIndex;
      this.endRow = endRow;
      this.endColumn = endColumn;
   }

   clone() {
      return new Range(this.location, this.startIndex, this.startRow, this.startColumn,
         this.endIndex, this.endRow, this.endColumn);
   }

   toString() {
      return JSON.stringify(this);
   }

   equal(other) {
      return this.location.publicId === other.location.publicId &&
         this.location.systemId === other.location.systemId &&
         this.startIndex === other.startIndex &&
         this.startRow === other.startRow &&
         this.startColumn === other.startColumn &&
         this.endIndex === other.endIndex &&
         this.endRow === other.endRow &&
         this.endColumn === other.endColumn;
   }
}

module.exports = Range;
