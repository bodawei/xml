/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

class Chunk {

   constructor(text, originalText, range) {
      this.text = text;
      this.originalText = originalText;
      this.range = Array.isArray(range) ? range : [ range ];
   }

}

module.exports = Chunk;
