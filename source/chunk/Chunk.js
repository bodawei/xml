/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

class Chunk {

   constructor(text, originalText, range) {
      this.text = text;
      this.originalText = originalText;
      this.range = Array.isArray(range) ? range : [ range ];
   }

}

module.exports = Chunk;
