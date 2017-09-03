/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

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
