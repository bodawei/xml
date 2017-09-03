/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/**********************************************************************\
 An Offset is used to track a particular index, and row/column
 position in an entity identified by an entityLocation.
\**********************************************************************/

class Offset {

   constructor(entityLocation, index, row, column) {
      this.location = entityLocation;
      this.index = index || 0;
      this.row = row || 0;
      this.column = column || 0;
   }

   clone() {
      return new Offset(this.location, this.index, this.row, this.column);
   }
}

module.exports = Offset;
