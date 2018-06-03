/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import EntityLocation from './EntityLocation';

/**********************************************************************\
 An Offset is used to track a particular index, and row/column
 position in an entity identified by an entityLocation.
\**********************************************************************/

class Offset {
   public location: EntityLocation | void;
   public index: number;
   public row: number;
   public column: number;

   constructor(location: EntityLocation|void, index: number = 0, row: number = 0, column: number = 0) {
      this.location = location;
      this.index = index;
      this.row = row;
      this.column = column;
   }

   clone() {
      return new Offset(this.location, this.index, this.row, this.column);
   }

   equals(other: Offset|void) {
      let locationsEqual = false;

      if (!other) {
         return false;
      }

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
