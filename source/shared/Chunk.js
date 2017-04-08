/* Copyright ® 2016-2017 by David John Burrowes. All rights reserved. */

'use strict';

class Chunk {

   constructor(text, originalText, startOffset, endOffset, entityLocation) {
      if (typeof originalText !== 'string') {
         entityLocation = endOffset;
         endOffset = startOffset;
         startOffset = originalText;
         originalText = text;
      }

      this.text = text;
      this.originalText = originalText;
      this.startOffset = startOffset;
      this.endOffset = endOffset;
      this.entityLocation = entityLocation;
   }

}

module.exports = Chunk;
