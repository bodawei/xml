/* Copyright ® 2016-2017 by David John Burrowes. All rights reserved. */

'use strict';

class Chunk {

   constructor(text, originalText, ranges) {
      if (typeof originalText !== 'string') {
         ranges = originalText;
         originalText = text;
      }

      this.text = text;
      this.originalText = originalText;
      this.range = Array.isArray(ranges) ? ranges : [ ranges ];
   }

}

module.exports = Chunk;
