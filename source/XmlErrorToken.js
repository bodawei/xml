/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const XmlToken = require('./XmlToken.js');

class XmlErrorToken extends XmlToken {

   constructor(type, code, message) {
      super(type, '');
      this.type = type;
      this.code = code;
      this.message = message;
   }

}

XmlErrorToken.ERROR = {
   XML_NOT_LOWERCASE: 'XmlTargetNotLowerCase',
   NO_SPACE_BEFORE_ATTR: 'NO_SPACE_BEFORE_ATTR',
   UNKNOWN_ATTR: 'UNKNOWN_ATTR',
   NO_ATTRIBUTES: 'NO_ATTRIBUTES',
   ATTR_WRONG_ORDER: 'ATTR_WRONG_ORDER',
   BAD_VERSION: 'BAD_VERSION',
   BAD_ENCODING: 'BAD_ENCODING',
   BAD_STANDALONE: 'BAD_STANDALONE',
   MISSING_XMLDECL_CLOSE: 'MISSING_XMLDECL_CLOSE',
   XMLDECL_ATTR_WRONG_CASE: 'XMLDECL_ATTR_WRONG_CASE',
   XMLDECL_STANDALONE_WRONG_CASE: 'XMLDECL_STANDALONE_WRONG_CASE',
   PI_SPACE_BEFORE_TARGET: 'PI_SPACE_BEFORE_TARGET',
   PI_TARGET_NOT_NAME: 'PI_TARGET_NOT_NAME',
   PI_NO_TERMINATOR: 'PI_NO_TERMINATOR',
   PI_NO_TARGET: 'PI_NO_TARGET',
   COMMENT_MISSING_END: 'COMMENT_MISSING_END',
   COMMENT_ENDS_WITH_HYPHEN: 'COMMENT_ENDS_WITH_HYPHEN',
   ELEMENT_UNBALANCED: 'ELEMENT_UNBALANCED',
   ELEMENT_LEADING_SPACE: 'ELEMENT_LEADING_SPACE',
   ELEMENT_MISSING_NAME: 'ELEMENT_MISSING_NAME',
   ELEMENT_BAD_NAME: 'ELEMENT_BAD_NAME',
   ELEMENT_MISSING_CLOSE: 'ELEMENT_MISSING_CLOSE',
   ELEMENT_BAD_CLOSE: 'ELEMENT_BAD_CLOSE',
   ATTRIBUTE_BAD_NAME: 'ATTRIBUTE_BAD_NAME',
   ATTRIBUTE_MISSING_QUOTE: 'ATTRIBUTE_MISSING_QUOTE',
   ATTRIBUTE_MISSING_CLOSE_QUOTE: 'ATTRIBUTE_MISSING_CLOSE_QUOTE',
   ATTRIBUTE_MISSING_EQUAL: 'ATTRIBUTE_MISSING_EQUAL',
   ATTRIBUTE_BAD_VALUE: 'ATTRIBUTE_BAD_VALUE',
   ATTRIBUTE_MISSING_VALUE: 'ATTRIBUTE_MISSING_VALUE',
   CHARDATA_BAD_DATA: 'CHARDATA_BAD_DATA',
   CDATA_MISSING_CLOSE: 'CDATA_MISSING_CLOSE',
   CDATA_SPACE_BEFORE_NAME: 'CDATA_SPACE_BEFORE_NAME',
   CDATA_SPACE_AFTER_NAME: 'CDATA_SPACE_AFTER_NAME',
   CDATA_NOT_CAPITALIZED: 'CDATA_NOT_CAPITALIZED',
   SPACE_BEFORE_SQUARE_BRACKET: 'SPACE_BEFORE_SQUARE_BRACKET',
   BANGITEM_UNSUPPORTED: 'BANGITEM_UNSUPPORTED'
};

XmlErrorToken.STRING = {};

const err = XmlErrorToken.ERROR;
const str = XmlErrorToken.STRING;

str[err.NO_SPACE_BEFORE_ATTR] = 'There must be a space before an attribute name.';
str[err.NO_ATTRIBUTES] = 'There must be at least a version specified for an XML Declaration.';
str[err.MISSING_XMLDECL_CLOSE] = 'Missing closing ?> on XML Declaration.';
str[err.PI_NO_TERMINATOR] = 'Closing ?> not found for processing instruction.';
str[err.PI_NO_TARGET] = 'Missing target name in processing instruction.';
str[err.COMMENT_MISSING_END] = 'Closing --> not found for comment.';
str[err.COMMENT_ENDS_WITH_HYPHEN] = 'Comment should not end with a hyphen.';
str[err.ELEMENT_LEADING_SPACE] = 'Space found after opening of an element tag.';
str[err.ELEMENT_MISSING_NAME] = 'Name missing in element tag.';
str[err.ELEMENT_MISSING_CLOSE] = 'Missing closing of element tag.';
str[err.ELEMENT_END_BAD_CLOSE] = 'Got the wrong close of an end element tag.';
str[err.ATTRIBUTE_MISSING_QUOTE] = 'No quote found for an attribute.';
str[err.ATTRIBUTE_MISSING_CLOSE_QUOTE] = 'No closing quote for an attribute.';
str[err.ATTRIBUTE_MISSING_EQUAL] = 'No equal sign found for an attribute.';
str[err.ATTRIBUTE_MISSING_VALUE] = 'Missing value for an attribute.';
str[err.CHARDATA_BAD_DATA] = 'Found unexpected "]]>" in chardata.';
str[err.CDATA_MISSING_CLOSE] = 'Closing ]]> not found for CDATA section.';
str[err.BANGITEM_UNSUPPORTED] = 'Unsupported "<!" item.';
str[err.SPACE_BEFORE_SQUARE_BRACKET] = 'Space found before opening "[".';
str[err.CDATA_SPACE_BEFORE_NAME] = 'Space found before CDATA.';
str[err.CDATA_SPACE_AFTER_NAME] = 'Space found after CDATA.';

module.exports = XmlErrorToken;
