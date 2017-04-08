/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

class PlainChunk {

   constructor(text, startOffset, endOffset, entityLocation) {
      this.text = text;
      this.startOffset = startOffset;
      this.endOffset = endOffset;
      this.entityLocation = entityLocation;
   }

}

class WithSpaceChunk extends PlainChunk {

   constructor(text, originalText, startOffset, endOffset, entityLocation) {
      super(text, startOffset, endOffset, entityLocation);
      this.originalText = originalText;
   }
}

module.exports = {
   PlainChunk: PlainChunk,
   WithSpaceChunk: WithSpaceChunk
};
