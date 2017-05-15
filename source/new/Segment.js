/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

/**********************************************************************\
 @@@@
\**********************************************************************/

class Segment {

   constructor(text, range) {
      this.text = text;
      this.index = 0;
      this.range = range;
   }

   atEnd() {
      return this.index >= this.text.length;
   }
}

module.exports = Segment;
