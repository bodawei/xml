/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/**********************************************************************\
\**********************************************************************/

class Offset {

   constructor(location, index, row, column) {
      this.location = location;
      this.index = index || 0;
      this.row = row || 0;
      this.column = column || 0;
   }

   clone() {
      return new Offset(this.location, this.index, this.row, this.column);
   }
}

module.exports = Offset;
