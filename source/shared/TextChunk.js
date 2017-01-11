/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

class PlainChunk {

   constructor(text, startOffset, endOffset, entityLocation) {
      this.text = text;
      this.startOffset = startOffset;
      this.endOffset = endOffset;
      this.entityLocation = entityLocation;
      this.invalidChars = undefined;
   }

}

class WithSpaceChunk extends PlainChunk {

   constructor(text, originalText, startOffset, endOffset, entityLocation) {
      super(text, startOffset, endOffset, entityLocation);
      this.originalText = originalText;
   }
}

class DigitChunk extends PlainChunk {

   constructor(text, isDecimal, startOffset, endOffset, entityLocation) {
      super(text, startOffset, endOffset, entityLocation);
      this.isDecimal = isDecimal;
   }
}

module.exports = {
   PlainChunk: PlainChunk,
   WithSpaceChunk: WithSpaceChunk,
   DigitChunk: DigitChunk,
   TYPE: {
      STRING: 'STRING_TYPE',
      SPACE: 'SPACE_TYPE',
      MARKUP: 'MARKUP_TYPE',
      CLOSE: 'CLOSE_TYPE'
   }
};
