/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

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
      return this;
   }
}

module.exports = Offset;
