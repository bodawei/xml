/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import EntityLocation from './EntityLocation';

/**********************************************************************\
 An Offset is used to track a particular index, and row/column
 position in an entity identified by an entityLocation.
\**********************************************************************/

class Offset {
   public location: EntityLocation;
   public index: number;
   public row: number;
   public column: number;

   constructor(location: EntityLocation, index: number = 0, row: number = 0, column: number = 0) {
      this.location = location;
      this.index = index;
      this.row = row;
      this.column = column;
   }

   clone() {
      return new Offset(this.location, this.index, this.row, this.column);
   }

   equals(other: Offset) {
      return this.location.equals(other.location) &&
         this.index === other.index &&
         this.row === other.row &&
         this.column === other.column;
   }
}

export default Offset;
