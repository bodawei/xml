/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

class XmlStringToken {

   constructor(text, type, startOffset, endOffset) {
      this.text = text;
      this.type = type;
      this.startOffset = startOffset;
      this.endOffset = endOffset;
   }

}

XmlStringToken.STRING = 'STRING';
XmlStringToken.SPACE = 'SPACE';
XmlStringToken.CHAR = 'CHAR';
XmlStringToken.WORD = 'WORD';
XmlStringToken.MARKUP = 'MARKUP';

module.exports = XmlStringToken;
