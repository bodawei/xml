/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

class XmlStringToken {

   constructor(text, startOffset, endOffset) {
      this.text = text;
      this.originalText = text;
      this.startOffset = startOffset;
      this.endOffset = endOffset;
   }

}

XmlStringToken.STRING = 'STRING';
XmlStringToken.SPACE = 'SPACE';
XmlStringToken.MARKUP = 'MARKUP';

module.exports = XmlStringToken;
