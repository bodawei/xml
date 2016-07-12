/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

class PlainChunk {

   constructor(text, startOffset, endOffset) {
      this.text = text;
      this.startOffset = startOffset;
      this.endOffset = endOffset;
   }

}

class WordChunk extends PlainChunk {

   constructor(text, couldBeName, startOffset, endOffset) {
      super(text, startOffset, endOffset);
      this.couldBeName = couldBeName;
   }
}

class WithSpaceChunk extends PlainChunk {

   constructor(text, originalText, startOffset, endOffset) {
      super(text, startOffset, endOffset);
      this.originalText = originalText;
   }
}

module.exports = {
   PlainChunk: PlainChunk,
   WordChunk: WordChunk,
   WithSpaceChunk: WithSpaceChunk,
   TYPE: {
      STRING: 'STRING_TYPE',
      SPACE: 'SPACE_TYPE',
      MARKUP: 'MARKUP_TYPE'
   }
};
