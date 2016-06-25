/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

class XmlToken {

   constructor(type, data) {
      this.type = type;
      this.data = data;
   }

}

XmlToken.SPACE = 'WhiteSpace';
XmlToken.CHARDATA = 'CharData';
XmlToken.COMMENT = 'Comment';
XmlToken.XMLDECL = 'XmlDecl';
XmlToken.PI = 'ProcessingInstruction';
XmlToken.SYNTAX_ERROR = 'SyntaxError';
XmlToken.ELEMENT_START = 'ElementStartTag';
XmlToken.ELEMENT_EMPTY = 'ElementEmptyTag';
XmlToken.ELEMENT_END = 'ElementEndTag';

module.exports = XmlToken;
