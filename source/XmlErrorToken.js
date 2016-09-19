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
   BANGITEM_UNSUPPORTED: 'BANGITEM_UNSUPPORTED',
   BANGITEM_UNKNOWN_BRACKET_NAME: 'BANGITEM_UNKNOWN_BRACKET_NAME',
   BANGITEM_MISSING_SECOND_SQUARE: 'BANGITEM_MISSING_SECOND_SQUARE',
   BANGITEM_NO_NAME: 'BANGITEM_NO_NAME',
   BANGITEM_EXTRA_LEADING_SPACE: 'BANGITEM_EXTRA_LEADING_SPACE',
   BANGITEM_NO_TYPE: 'BANGITEM_NO_TYPE',
   BANGITEM_WRONG_CASE: 'BANGITEM_WRONG_CASE',
   DECLARATION_MISSING_SPACE_AFTER_NAME: 'DECLARATION_MISSING_SPACE_AFTER_NAME',
   NOT_SUPPORTED: 'NOT_SUPPORTED',
   REFERENCE_ILLEGAL_SPACE: 'REFERENCE_ILLEGAL_SPACE',
   REFERENCE_ILLEGAL_TRAILING_SPACE: 'REFERENCE_ILLEGAL_TRAILING_SPACE',
   REFERENCE_NO_NAME: 'REFERENCE_NO_NAME',
   REFERENCE_NO_SEMICOLON: 'REFERENCE_NO_SEMICOLON',
   CHAR_REFERENCE_ILLEGAL_SPACE: 'CHAR_REFERENCE_ILLEGAL_SPACE',
   CHAR_REFERENCE_HEX_CASE_WRONG: 'CHAR_REFERENCE_HEX_CASE_WRONG',
   CHAR_REFERENCE_SPACE_BEFORE_DIGITS: 'CHAR_REFERENCE_SPACE_BEFORE_DIGITS',
   CHAR_REFERENCE_NO_DIGITS: 'CHAR_REFERENCE_NO_DIGITS',
   CHAR_REFERENCE_SPACE_AFTER_DIGITS: 'CHAR_REFERENCE_SPACE_AFTER_DIGITS',
   CHAR_REFERENCE_MISSING_SEMICOLON: 'CHAR_REFERENCE_MISSING_SEMICOLON',
   CHAR_REFERENCE_HEX_DIGITS_DECIMAL_REF: 'CHAR_REFERENCE_HEX_DIGITS_DECIMAL_REF',
   DOCTYPE_PARAM_BAD_CASE: 'DOCTYPE_PARAM_BAD_CASE',
   DOCTYPE_TYPE_NOT_NAME: 'DOCTYPE_TYPE_NOT_NAME',
   DOCTYPE_NO_NAME: 'DOCTYPE_NO_NAME',
   DOCTYPE_MISSING_CLOSE_BRACKET: 'DOCTYPE_MISSING_CLOSE_BRACKET',
   DOCTYPE_EXTRA_JUNK: 'DOCTYPE_EXTRA_JUNK',
   EXTERNALID_UNKNOWN_ID: 'EXTERNALID_UNKNOWN_ID',
   PUBLIC_NO_SPACE: 'PUBLIC_NO_SPACE',
   PUBLIC_NO_LEADING_SPACE: 'PUBLIC_NO_LEADING_SPACE',
   SYSTEM_NO_LEADING_SPACE: 'SYSTEM_NO_LEADING_SPACE',
   PUBIDLITERAL_BAD_CHARS: 'PUBIDLITERAL_BAD_CHARS',
   PUBIDLITERAL_NOQUOTE: 'PUBIDLITERAL_NOQUOTE',
   PUBIDLITERAL_MISSING: 'PUBIDLITERAL_MISSING',
   SYSTEMLITERAL_NOQUOTE: 'SYSTEMLITERAL_NOQUOTE',
   SYSTEMLITERAL_MISSING: 'SYSTEMLITERAL_MISSING',
   NOTATION_MISSING_NAME: 'NOTATION_MISSING_NAME',
   NOTATION_NAME_NOT_NAME: 'NOTATION_NAME_NOT_NAME',
   NOTATION_MISSING_EXTERNALID: 'NOTATION_MISSING_EXTERNALID',
   NOTATION_MISSING_SPACE_AFTER_NAME: 'NOTATION_MISSING_SPACE_AFTER_NAME',
   NOTATION_MISSING_CLOSE_BRACKET: 'NOTATION_MISSING_CLOSE_BRACKET',
   NOTATION_EXTRA_JUNK: 'NOTATION_EXTRA_JUNK'
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
str[err.SPACE_BEFORE_SQUARE_BRACKET] = 'Space found before opening "[".';
str[err.CDATA_SPACE_BEFORE_NAME] = 'Space found before CDATA.';
str[err.CDATA_SPACE_AFTER_NAME] = 'Space found after CDATA.';
str[err.BANGITEM_UNSUPPORTED] = 'Unsupported "<!" item.';
str[err.BANGITEM_NO_TYPE] = 'No declaration found in an <!...> declaration.';
str[err.BANGITEM_MISSING_SECOND_SQUARE] = 'Second square bracket missing.';
str[err.BANGITEM_NO_NAME] = 'No target name provided in the <![name[ construction.';
str[err.BANGITEM_EXTRA_LEADING_SPACE] = 'Space found before name in a <!...> declaration.';
str[err.NOT_SUPPORTED] = 'Not supported at this time.';
str[err.REFERENCE_ILLEGAL_SPACE] = 'Unexpected space after & in reference.';
str[err.CHAR_REFERENCE_ILLEGAL_SPACE] = 'Unexpected space after # in character entity reference.';
str[err.CHAR_REFERENCE_HEX_CASE_WRONG] = 'Case of the "x" in a hexadecimal character entity reference is wrong.';
str[err.CHAR_REFERENCE_SPACE_BEFORE_DIGITS] = 'Unexpected space before digits in a character entity reference.';
str[err.CHAR_REFERENCE_NO_DIGITS] = 'No digits found in a character entity reference.';
str[err.CHAR_REFERENCE_SPACE_AFTER_DIGITS] =
   'Unexpected spaces found after the digits of a character entity reference.';
str[err.CHAR_REFERENCE_MISSING_SEMICOLON] = 'Semicolon missing from character entity reference.';
str[err.CHAR_REFERENCE_HEX_DIGITS_DECIMAL_REF] =
   'A character entity reference was specified as decimal (&#digits;) but included hex digits.';
str[err.REFERENCE_NO_NAME] = 'No entity name found.';
str[err.REFERENCE_NO_SEMICOLON] = 'A reference was found without a closing semicolon.';
str[err.PUBLIC_NO_SPACE] = 'No space was found beteen the publidLiteral and the systemLiteral.';
str[err.PUBLIC_NO_LEADING_SPACE] = 'No space was found beteen PUBLIC and the pubidLiteral.';
str[err.SYSTEM_NO_LEADING_SPACE] = 'No space was found beteen SYSTEM and the systemLiteral.';
str[err.PUBIDLITERAL_NOQUOTE] = 'The pubidLiteral was not quoted.';
str[err.PUBIDLITERAL_MISSING] = 'No pubIdLiteral was found.';
str[err.SYSTEMLITERAL_NOQUOTE] = 'The systemLiteral was not quoted.';
str[err.SYSTEMLITERAL_MISSING] = 'No systemLiteral was found.';
str[err.DOCTYPE_NO_NAME] = 'There was no name name for the DOCTYPE.';
str[err.DOCTYPE_MISSING_CLOSE_BRACKET] = 'The closing "<" for the DOCTYPE could not be found.';
str[err.DOCTYPE_EXTRA_JUNK] = 'Extra junk found in DOCTYPE declaration.';
str[err.NOTATION_MISSING_NAME] = 'No name found for a notation declaration.';
str[err.NOTATION_EXTRA_JUNK] = 'Extra junk found in NOTATION declaration.';

module.exports = XmlErrorToken;
