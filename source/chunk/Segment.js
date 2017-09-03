/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/**********************************************************************\
 Segment is a simple data structure that tracks information about a
 unit of text, including a current offset into that text, and an
 optional range tracking where that text came from in an overall
 entity.
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
