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
   XMLDECL_NO_ATTRIBUTES: 'XMLDECL_NO_ATTRIBUTES',
   XMLDECL_ATTR_UNKNOWN: 'XMLDECL_ATTR_UNKNOWN',
   XMLDECL_NO_CLOSE: 'XMLDECL_NO_CLOSE',
   XMLDECL_ATTR_WRONG_CASE: 'XMLDECL_ATTR_WRONG_CASE',
   XMLDECL_TARGET_WRONG_CASE: 'XMLDECL_TARGET_WRONG_CASE',
   XMLDECL_VERSION_INVALD: 'XMLDECL_VERSION_INVALD',
   XMLDECL_VERSION_WRONG_ORDER: 'XMLDECL_VERSION_WRONG_ORDER',
   XMLDECL_ENCODING_INVALID: 'XMLDECL_ENCODING_INVALID',
   XMLDECL_ENCODING_WRONG_ORDER: 'XMLDECL_ENCODING_WRONG_ORDER',
   XMLDECL_STANDALONE_WRONG_CASE: 'XMLDECL_STANDALONE_WRONG_CASE',
   XMLDECL_STANDALONE_INVALID: 'XMLDECL_STANDALONE_INVALID',
   XMLDECL_STANDALONE_WRONG_ORDER: 'XMLDECL_STANDALONE_WRONG_ORDER',
   PI_SPACE_BEFORE_TARGET: 'PI_SPACE_BEFORE_TARGET',
   PI_TARGET_NOT_NAME: 'PI_TARGET_NOT_NAME',
   PI_NO_CLOSE: 'PI_NO_CLOSE',
   PI_NO_TARGET: 'PI_NO_TARGET',
   COMMENT_NO_CLOSE: 'COMMENT_NO_CLOSE',
   COMMENT_ENDS_WITH_HYPHEN: 'COMMENT_ENDS_WITH_HYPHEN',

   ENTITY_NO_NAME: 'ENTITY_NO_NAME',
   ENTITY_NAME_NOT_NAME: 'ENTITY_NAME_NOT_NAME',
   ENTITY_NAME_NO_TRAILING_SPACE: 'ENTITY_NAME_NO_TRAILING_SPACE',
   ENTITY_NDATA_NO_SPACE_BEFORE: 'ENTITY_NDATA_NO_SPACE_BEFORE',
   ENTITY_NDATA_WRONG_CASE: 'ENTITY_NDATA_WRONG_CASE',
   ENTITY_NDATA_NO_NAME: 'ENTITY_NDATA_NO_NAME',
   ENTITY_NO_VALUE: 'ENTITY_NO_VALUE',
   ENTITY_NO_CLOSE: 'ENTITY_NO_CLOSE',
   ELEMENTDECL_NO_NAME: 'ELEMENTDECL_NO_NAME',
   ELEMENTDECL_NO_SPACE_AFTER_NAME: 'ELEMENTDECL_NO_SPACE_AFTER_NAME',
   ELEMENTDECL_NAME_NOT_NAME: 'ELEMENTDECL_NAME_NOT_NAME',
   ELEMENTDECL_NO_CONTENT_TYPE: 'ELEMENTDECL_NO_CONTENT_TYPE',
   ELEMENTDECL_CONTENT_TYPE_WRONG_CASE: 'ELEMENTDECL_CONTENT_TYPE_WRONG_CASE',
   ELEMENTDECL_CONTENT_TYPE_UNKNOWN: 'ELEMENTDECL_CONTENT_TYPE_UNKNOWN',
   ELEMENTDECL_NO_CLOSE: 'ELEMENTDECL_NO_CLOSE',

   ELEMENT_UNBALANCED: 'ELEMENT_UNBALANCED',
   ELEMENT_LEADING_SPACE: 'ELEMENT_LEADING_SPACE',
   ELEMENT_MISSING_NAME: 'ELEMENT_MISSING_NAME',
   ELEMENT_BAD_NAME: 'ELEMENT_BAD_NAME',
   ELEMENT_MISSING_CLOSE: 'ELEMENT_MISSING_CLOSE',
   ELEMENT_BAD_CLOSE: 'ELEMENT_BAD_CLOSE',
   ATTRIBUTE_BAD_NAME: 'ATTRIBUTE_BAD_NAME',
   ATTRIBUTE_NO_SPACE_BEFORE_NAME: 'ATTRIBUTE_NO_SPACE_BEFORE_NAME',
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
   NOTATION_MISSING_CLOSE_BRACKET: 'NOTATION_MISSING_CLOSE_BRACKET'
};

XmlErrorToken.STRING = {};

const err = XmlErrorToken.ERROR;
const str = XmlErrorToken.STRING;

// THING(_SUBTHING)_PROBLEM = "THING must WHATEVER. Found OTHER"
// THING_NO_(whatever) = "Missing WHATEVER for THING"
str[err.XMLDECL_NO_ATTRIBUTES] = 'Missing version in an XML Declaration.';
str[err.XMLDECL_NO_CLOSE] = 'Missing closing "?>" in an XML Declaration.';
str[err.XMLDECL_ATTR_WRONG_CASE] = '"{0}" must be lower case. Found "{1}".';
str[err.XMLDECL_ATTR_UNKNOWN] = 'Unknown XML Declaration parameter "{0}".';
str[err.XMLDECL_TARGET_WRONG_CASE] = '"xml" must be lower case. Found "{0}".';
str[err.XMLDECL_VERSION_INVALD] = '"version" must be "1.0" or "1.1". Found "{0}".';
str[err.XMLDECL_VERSION_WRONG_ORDER] = '"version" must be the first attribute. Found as #{0}.';
str[err.XMLDECL_ENCODING_INVALID] = '"encoding" must be alphanumeric. Found "{0}".';
str[err.XMLDECL_ENCODING_WRONG_ORDER] = '"encoding" must be after "version" and before "standalone".';
str[err.XMLDECL_STANDALONE_WRONG_CASE] = '"{0}" must be lower case. Found "{1}".';
str[err.XMLDECL_STANDALONE_INVALID] = '"standalone" must be "yes" or "no". Found "{0}".';
str[err.XMLDECL_STANDALONE_WRONG_ORDER] = '"standalone" must come after "version".';
str[err.PI_SPACE_BEFORE_TARGET] = 'Must not have a space before the target name.';
str[err.PI_TARGET_NOT_NAME] = 'The target name must match the syntax for names. Found: "{0}".';
str[err.PI_NO_CLOSE] = 'Missing closing ?> in a processing instruction.';
str[err.PI_NO_TARGET] = 'Missing target name in a processing instruction.';
str[err.COMMENT_NO_CLOSE] = 'Missing closing --> in a comment.';
str[err.COMMENT_ENDS_WITH_HYPHEN] = 'Must not have a hyphen at end of a comment.';

str[err.ENTITY_NO_NAME] = 'No name found for an entity declaration.';
str[err.ENTITY_NAME_NOT_NAME] = 'The entity name must match the syntax for names. Found: "{0}".';
str[err.ENTITY_NAME_NO_TRAILING_SPACE] = 'Missing space after the entity "{0}".';
str[err.ENTITY_NDATA_NO_SPACE_BEFORE] = 'Missing space before NDATA in entity "{0}".';
str[err.ENTITY_NDATA_WRONG_CASE] = 'NDATA in entity "{0}" must be upper case. Found "{1}".';
str[err.ENTITY_NDATA_NO_NAME] = 'NDATA in entity "{0}" must have a name.';
str[err.ENTITY_NO_VALUE] = 'Missing value or external identifier in entity "{0}".';
str[err.ENTITY_NO_CLOSE] = 'Missing closing ">" in the entity "{0}".';

str[err.ELEMENTDECL_NO_NAME] = 'No name found for an element declaration.';
str[err.ELEMENTDECL_NAME_NOT_NAME] = 'The element declaration name must match the syntax for names. Found: "{0}".';
str[err.ELEMENTDECL_NO_CONTENT_TYPE] = 'No content type found for element declaration "{0}".';
str[err.ELEMENTDECL_CONTENT_TYPE_WRONG_CASE] = 'The content type must be "{0}". Found "{1}".';
str[err.ELEMENTDECL_CONTENT_TYPE_UNKNOWN] = 'An unknown content type was found. Found "{0}".';
str[err.ELEMENTDECL_NO_CLOSE] = 'Missing closing ">" in the element declaration "{0}".';

str[err.ELEMENT_LEADING_SPACE] = 'Space found after opening of an element tag.';
str[err.ELEMENT_MISSING_NAME] = 'Name missing in element tag.';
str[err.ELEMENT_MISSING_CLOSE] = 'Missing closing of element tag.';
str[err.ELEMENT_END_BAD_CLOSE] = 'Got the wrong close of an end element tag.';
str[err.ATTRIBUTE_NO_SPACE_BEFORE_NAME] = 'Missing space before attribute name.';
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
str[err.DOCTYPE_MISSING_CLOSE_BRACKET] = 'The closing ">" for the DOCTYPE could not be found.';
str[err.NOTATION_MISSING_NAME] = 'No name found for a notation declaration.';

module.exports = XmlErrorToken;
