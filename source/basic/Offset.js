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

   equals(other) {
      let locationsEqual = false;

      if (!this.location && !other.location) {
         locationsEqual = true;
      } else if (!this.location) {
         locationsEqual = false;
      } else {
         locationsEqual = this.location.equals(other.location);
      }

      return locationsEqual &&
         this.index === other.index &&
         this.row === other.row &&
         this.column === other.column;
   }
}

export default Offset;
