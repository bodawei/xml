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
   XMLDECL_ATTR_INVALID_CASE: 'XMLDECL_ATTR_INVALID_CASE',
   XMLDECL_TARGET_INVALID_CASE: 'XMLDECL_TARGET_INVALID_CASE',
   XMLDECL_VERSION_INVALD: 'XMLDECL_VERSION_INVALD',
   XMLDECL_VERSION_INVALID_ORDER: 'XMLDECL_VERSION_INVALID_ORDER',
   XMLDECL_ENCODING_INVALID: 'XMLDECL_ENCODING_INVALID',
   XMLDECL_ENCODING_INVALID_ORDER: 'XMLDECL_ENCODING_INVALID_ORDER',
   XMLDECL_STANDALONE_INVALID: 'XMLDECL_STANDALONE_INVALID',
   XMLDECL_STANDALONE_INVALID_CASE: 'XMLDECL_STANDALONE_INVALID_CASE',
   XMLDECL_STANDALONE_INVALID_ORDER: 'XMLDECL_STANDALONE_INVALID_ORDER',

   PI_SPACE_BEFORE_TARGET: 'PI_SPACE_BEFORE_TARGET',
   PI_TARGET_NAME_INVALID: 'PI_TARGET_NAME_INVALID',
   PI_NO_CLOSE: 'PI_NO_CLOSE',
   PI_NO_TARGET: 'PI_NO_TARGET',

   COMMENT_NO_CLOSE: 'COMMENT_NO_CLOSE',
   COMMENT_ENDS_WITH_HYPHEN: 'COMMENT_ENDS_WITH_HYPHEN',

   ELEMENT_UNBALANCED: 'ELEMENT_UNBALANCED',
   ELEMENT_XTRA_LEADING_SPACE: 'ELEMENT_XTRA_LEADING_SPACE',
   ELEMENT_NO_NAME: 'ELEMENT_NO_NAME',
   ELEMENT_NAME_INVALID: 'ELEMENT_NAME_INVALID',
   ELEMENT_NO_CLOSE: 'ELEMENT_NO_CLOSE',
   ELEMENT_BAD_CLOSE: 'ELEMENT_BAD_CLOSE',
   ELEMENT_END_INVALID_CLOSE: 'ELEMENT_END_INVALID_CLOSE',

   ATTRIBUTE_INVALID_NAME: 'ATTRIBUTE_INVALID_NAME',
   ATTRIBUTE_NO_SPACE_BEFORE_NAME: 'ATTRIBUTE_NO_SPACE_BEFORE_NAME',
   ATTRIBUTE_NO_EQUAL: 'ATTRIBUTE_NO_EQUAL',
   ATTRIBUTE_NO_VALUE: 'ATTRIBUTE_NO_VALUE',
   ATTRIBUTE_NO_QUOTE: 'ATTRIBUTE_NO_QUOTE',
   ATTRIBUTE_NO_CLOSE_QUOTE: 'ATTRIBUTE_NO_CLOSE_QUOTE',
   ATTRIBUTE_INVALID_VALUE: 'ATTRIBUTE_INVALID_VALUE',

   CHARDATA_INVALID_TEXT: 'CHARDATA_INVALID_TEXT',

   CDATA_NO_CLOSE: 'CDATA_NO_CLOSE',
   CDATA_XTRA_SPACE_BEFORE: 'CDATA_XTRA_SPACE_BEFORE',
   CDATA_XTRA_SPACE_AFTER: 'CDATA_XTRA_SPACE_AFTER',
   CDATA_INVALID_CASE: 'CDATA_INVALID_CASE',

   REFERENCE_NO_NAME: 'REFERENCE_NO_NAME',
   REFERENCE_NO_SEMICOLON: 'REFERENCE_NO_SEMICOLON',
   REFERENCE_XTRA_SPACE: 'REFERENCE_XTRA_SPACE',
   REFERENCE_XTRA_TRAILING_SPACE: 'REFERENCE_XTRA_TRAILING_SPACE',

   CHARREF_XTRA_SPACE: 'CHARREF_XTRA_SPACE',
   CHARREF_INVALID_HEX_CASE: 'CHARREF_INVALID_HEX_CASE',
   CHARREF_XTRA_SPACE_BEFORE_DIGITS: 'CHARREF_XTRA_SPACE_BEFORE_DIGITS',
   CHARREF_NO_DIGITS: 'CHARREF_NO_DIGITS',
   CHARREF_XTRA_SPACE_AFTER_DIGITS: 'CHARREF_XTRA_SPACE_AFTER_DIGITS',
   CHARREF_NO_SEMICOLON: 'CHARREF_NO_SEMICOLON',
   CHARREF_INVALID_BASE: 'CHARREF_INVALID_BASE',

   BANGITEM_UNKNOWN: 'BANGITEM_UNKNOWN',
   BANGITEM_NAME_XTRA_SPACE_BEFORE: 'BANGITEM_NAME_XTRA_SPACE_BEFORE',
   BANGITEM_NO_NAME: 'BANGITEM_NO_NAME',
   BANGITEM_NAME_INVALID_CASE: 'BANGITEM_NAME_INVALID_CASE',
   BANGITEM_NAME_XTRA_SPACE_AFTER: 'BANGITEM_NAME_XTRA_SPACE_AFTER',

   BRACKETITEM_XTRA_SPACE_BEFORE: 'BRACKETITEM_XTRA_SPACE_BEFORE',
   BRACKETITEM_UNKNOWN: 'BRACKETITEM_UNKNOWN',
   BRACKETITEM_NO_SECOND_BRACKET: 'BRACKETITEM_NO_SECOND_BRACKET',
   BRACKETITEM_NO_NAME: 'BRACKETITEM_NO_NAME',

   DOCTYPE_NO_NAME: 'DOCTYPE_NO_NAME',
   DOCTYPE_NAME_INVALID: 'DOCTYPE_NAME_INVALID',
   DOCTYPE_NO_CLOSE: 'DOCTYPE_NO_CLOSE',

   ENTITYDECL_NO_NAME: '.ENTITYDECL_NO_NAME',
   EXTERNALID_INVALID_CASE: 'EXTERNALID_INVALID_CASE',
   ENTITYDECL_NAME_INVALID: 'ENTITYDECL_NAME_INVALID',
   ENTITYDECL_NAME_NO_TRAILING_SPACE: 'ENTITYDECL_NAME_NO_TRAILING_SPACE',
   ENTITYDECL_NDATA_NO_SPACE_BEFORE: 'ENTITYDECL_NDATA_NO_SPACE_BEFORE',
   ENTITYDECL_NDATA_INVALID_CASE: 'ENTITYDECL_NDATA_INVALID_CASE',
   ENTITYDECL_NDATA_NO_NAME: 'ENTITYDECL_NDATA_NO_NAME',
   ENTITYDECL_NO_VALUE: 'ENTITYDECL_NO_VALUE',
   ENTITYDECL_NO_CLOSE: 'ENTITYDECL_NO_CLOSE',

   ELEMENTDECL_NO_NAME: 'ELEMENTDECL_NO_NAME',
   ELEMENTDECL_NO_SPACE_AFTER_NAME: 'ELEMENTDECL_NO_SPACE_AFTER_NAME',
   ELEMENTDECL_NAME_INVALID: 'ELEMENTDECL_NAME_INVALID',
   ELEMENTDECL_NO_SPEC: 'ELEMENTDECL_NO_SPEC',
   ELEMENTDECL_SPEC_INVALID_CASE: 'ELEMENTDECL_SPEC_INVALID_CASE',
   ELEMENTDECL_SPEC_UNKNOWN: 'ELEMENTDECL_SPEC_UNKNOWN',
   ELEMENTDECL_SPEC_NO_ORS: 'ELEMENTDECL_SPEC_NO_ORS',
   ELEMENTDECL_SPEC_NO_NAMES: 'ELEMENTDECL_SPEC_NO_NAMES',
   ELEMENTDECL_SPEC_NAME_INVALID: 'ELEMENTDECL_SPEC_NAME_INVALID',
   ELEMENTDECL_PCDATA_NOT_FIRST: 'ELEMENTDECL_PCDATA_NOT_FIRST',
   ELEMENTDECL_SPEC_ITEMS_MISSING: 'ELEMENTDECL_SPEC_ITEMS_MISSING',
   ELEMENTDECL_NO_SPEC_CLOSE: 'ELEMENTDECL_NO_SPEC_CLOSE',
   ELEMENTDECL_NO_CLOSE: 'ELEMENTDECL_NO_CLOSE',

   ATTLISTDECL_NO_NAME: 'ATTLISTDECL_NO_NAME',
   ATTLISTDECL_NAME_INVALID: 'ATTLISTDECL_NAME_INVALID',
   ATTLISTDECL_NO_ATTRIBUTES: 'ATTLISTDECL_NO_ATTRIBUTES',
   ATTLISTDECL_ATTR_NAME_INVALID: 'ATTLISTDECL_ATTR_NAME_INVALID',
   ATTLISTDECL_ATTR_NO_TYPE: 'ATTLISTDECL_ATTR_NO_TYPE',
   ATTLISTDECL_ATTR_TYPE_UNKNOWN: 'ATTLISTDECL_ATTR_TYPE_UNKNOWN',
   ATTLISTDECL_ATTR_TYPE_INVALID: 'ATTLISTDECL_ATTR_TYPE_INVALID',
   ATTLISTDECL_ATTR_NOTA_NO_SPACE: 'ATTLISTDECL_ATTR_NOTA_NO_SPACE',
   ATTLISTDECL_ATTR_LIST_NO_NAMES: 'ATTLISTDECL_ATTR_LIST_NO_NAMES',
   ATTLISTDECL_ATTR_LIST_NO_ORS: 'ATTLISTDECL_ATTR_LIST_NO_ORS',
   ATTLISTDECL_ATTR_NOTA_NAME_INVALID: 'ATTLISTDECL_ATTR_NOTA_NAME_INVALID',
   ATTLISTDECL_ATTR_NOTA_EMPTY: 'ATTLISTDECL_ATTR_NOTA_EMPTY',
   ATTLISTDECL_ATTR_NOTA_NO_CLOSE: 'ATTLISTDECL_ATTR_NOTA_NO_CLOSE',
   ATTLISTDECL_ATTR_ENUM_NMTOKEN_INVALID: 'ATTLISTDECL_ATTR_ENUM_NMTOKEN_INVALID',
   ATTLISTDECL_ATTR_ENUM_NO_CLOSE: 'ATTLISTDECL_ATTR_ENUM_NO_CLOSE',
   ATTLISTDECL_ATTR_NO_DEFAULT: 'ATTLISTDECL_ATTR_NO_DEFAULT',
   ATTLISTDECL_ATTR_DEFAULT_NO_SPACE: 'ATTLISTDECL_ATTR_DEFAULT_NO_SPACE',
   ATTLISTDECL_ATTR_DEFAULT_INVALID: 'ATTLISTDECL_ATTR_DEFAULT_INVALID',
   ATTLISTDECL_ATTR_DEFAULT_UNKNOWN: 'ATTLISTDECL_ATTR_DEFAULT_UNKNOWN',
   ATTLISTDECL_FIXED_NO_SPACE: 'ATTLISTDECL_FIXED_NO_SPACE',
   ATTLISTDECL_ATTR_INVALID: 'ATTLISTDECL_ATTR_INVALID',
   ATTLISTDECL_ATTR_NO_CLOSE_QUOTE: 'ATTLISTDECL_ATTR_NO_CLOSE_QUOTE',
   ATTLISTDECL_NO_CLOSE: 'ATTLISTDECL_NO_CLOSE',

   NOTATIONDECL_NO_NAME: 'NOTATIONDECL_NO_NAME',
   NOTATIONDECL_NAME_INVALID: 'NOTATIONDECL_NAME_INVALID',
   NOTATIONDECL_NO_EXTERNALID: 'NOTATIONDECL_NO_EXTERNALID',
   NOTATIONDECL_NO_SPACE_AFTER_NAME: 'NOTATIONDECL_NO_SPACE_AFTER_NAME',
   NOTATIONDECL_NO_CLOSE: 'NOTATIONDECL_NO_CLOSE',

   EXTERNALID_UNKNOWN: 'EXTERNALID_UNKNOWN',
   EXTERNALID_PUBLIC_NO_SPACE: 'EXTERNALID_PUBLIC_NO_SPACE',
   EXTERNALID_PUBLIC_NO_LEADING_SPACE: 'EXTERNALID_PUBLIC_NO_LEADING_SPACE',
   EXTERNALID_SYSTEM_NO_LEADING_SPACE: 'EXTERNALID_SYSTEM_NO_LEADING_SPACE',
   EXTERNALID_PUBLIC_INVALID_CHARS: 'EXTERNALID_PUBLIC_INVALID_CHARS',
   EXTERNALID_PUBLIC_NO_QUOTE: 'EXTERNALID_PUBLIC_NO_QUOTE',
   EXTERNALID_NO_PUBLIC: 'EXTERNALID_NO_PUBLIC',
   EXTERNALID_SYSTEM_NO_QUOTE: 'EXTERNALID_SYSTEM_NO_QUOTE',
   EXTERNALID_NO_SYSTEM: 'EXTERNALID_NO_SYSTEM'
};

XmlErrorToken.STRING = {};

const err = XmlErrorToken.ERROR;
const str = XmlErrorToken.STRING;

// Styles for messages:
//   THING(_SUBTHING)_PROBLEM = "THING must WHATEVER. Found OTHER"
//   THING_NO_(whatever) = "Missing WHATEVER in a THING"
//   THING_XTRA_... = "Must not ..."
str[err.XMLDECL_NO_ATTRIBUTES] = 'Missing version in an XML Declaration.';
str[err.XMLDECL_NO_CLOSE] = 'Missing closing "?>" in an XML Declaration.';
str[err.XMLDECL_ATTR_INVALID_CASE] = '"{0}" must be lower case. Found "{1}".';
str[err.XMLDECL_ATTR_UNKNOWN] = 'Unknown XML Declaration parameter "{0}".';
str[err.XMLDECL_TARGET_INVALID_CASE] = '"xml" must be lower case. Found "{0}".';
str[err.XMLDECL_VERSION_INVALD] = '"version" must be "1.0" or "1.1". Found "{0}".';
str[err.XMLDECL_VERSION_INVALID_ORDER] = '"version" must be the first attribute. Found as #{0}.';
str[err.XMLDECL_ENCODING_INVALID] = '"encoding" must be alphanumeric. Found "{0}".';
str[err.XMLDECL_ENCODING_INVALID_ORDER] = '"encoding" must be after "version" and before "standalone".';
str[err.XMLDECL_STANDALONE_INVALID_CASE] = '"{0}" must be lower case. Found "{1}".';
str[err.XMLDECL_STANDALONE_INVALID] = '"standalone" must be "yes" or "no". Found "{0}".';
str[err.XMLDECL_STANDALONE_INVALID_ORDER] = '"standalone" must come after "version".';

str[err.PI_SPACE_BEFORE_TARGET] = 'Must not have a space before the target name.';
str[err.PI_NO_TARGET] = 'Missing target name in a processing instruction.';
str[err.PI_TARGET_NAME_INVALID] = 'The target name must match the syntax for names. Found: "{0}".';
str[err.PI_NO_CLOSE] = 'Missing closing ?> in a processing instruction.';

str[err.COMMENT_NO_CLOSE] = 'Missing closing --> in a comment.';
str[err.COMMENT_ENDS_WITH_HYPHEN] = 'Must not have a hyphen at end of a comment.';

str[err.ELEMENT_UNBALANCED] = 'Expected end tag "{0}". Found "{1}".';
str[err.ELEMENT_XTRA_LEADING_SPACE] = 'Must not have space after opening "<" of an element tag.';
str[err.ELEMENT_NO_NAME] = 'Missing name in element tag.';
str[err.ELEMENT_NAME_INVALID] = 'The element tag name must match the syntax for names. Found: "{0}".';
str[err.ELEMENT_NO_CLOSE] = 'Missing closing of element tag.';
str[err.ELEMENT_END_INVALID_CLOSE] = 'End element tag must close with ">". Found "/>".';

str[err.ATTRIBUTE_INVALID_NAME] = 'The attribute name must match the syntax for names. Found: "{0}".';
str[err.ATTRIBUTE_NO_SPACE_BEFORE_NAME] = '"{0}" must have a space before it.';
str[err.ATTRIBUTE_NO_EQUAL] = '"{0}" must be followed by an "=".';
str[err.ATTRIBUTE_NO_VALUE] = '"{0}" must have a value.';
str[err.ATTRIBUTE_NO_QUOTE] = 'The value for "{0}" must be quoted.';
str[err.ATTRIBUTE_NO_CLOSE_QUOTE] = 'The value for "{0}" must close with a quote.';
str[err.ATTRIBUTE_INVALID_VALUE] = 'The value of attribute "{0}" must not contain "<".';

str[err.CHARDATA_INVALID_TEXT] = '"]]>" must not appear in in character data.';

str[err.CDATA_INVALID_CASE] = '"CDATA" must be capitalized. Found "{0}".';
str[err.CDATA_XTRA_SPACE_BEFORE] = 'Must not have space before CDATA.';
str[err.CDATA_XTRA_SPACE_AFTER] = 'Must not have space after CDATA.';
str[err.CDATA_NO_CLOSE] = 'Missing closing "]]>" in CDATA section.';

str[err.REFERENCE_NO_NAME] = 'Missing name in entity reference.';
str[err.REFERENCE_NO_SEMICOLON] = 'Missing semicolon after entity reference "{0}".';
str[err.REFERENCE_XTRA_SPACE] = 'Must not have space in an entity reference.';
str[err.REFERENCE_XTRA_TRAILING_SPACE] = 'Must not have a space after the entity reference "{0}".';

str[err.CHARREF_XTRA_SPACE] = 'Must not have a space after the "#" in a character reference.';
str[err.CHARREF_INVALID_HEX_CASE] = '"x" in a hexadecimal character reference must be lower case.';
str[err.CHARREF_XTRA_SPACE_BEFORE_DIGITS] = 'Must not have spaces before digits in a character reference.';
str[err.CHARREF_NO_DIGITS] = 'Missing digits in a character reference.';
str[err.CHARREF_XTRA_SPACE_AFTER_DIGITS] = 'Must not have spaces after digits in a character reference.';
str[err.CHARREF_NO_SEMICOLON] = 'Must have a ";" after a character reference.';
str[err.CHARREF_INVALID_BASE] = 'A decimal character reference must not contain hex digits. Found "{0}".';

str[err.BANGITEM_UNKNOWN] = 'Unkown "<!" item.';
str[err.BANGITEM_NAME_XTRA_SPACE_BEFORE] = 'Must not have space before the name in a "<!" item.';
str[err.BANGITEM_NO_NAME] = 'Must have a name for a "<!" item.';
str[err.BANGITEM_NAME_INVALID_CASE] = '"{0}" must be upper case. Found "{1}".';
str[err.BANGITEM_NAME_XTRA_SPACE_AFTER] = 'Must not have space after "{0}" of a "<!" item.';

str[err.BRACKETITEM_XTRA_SPACE_BEFORE] = 'Must not have space before opening "[".';
str[err.BRACKETITEM_UNKNOWN] = 'Unknown "<![" item. Found "{0}".';
str[err.BRACKETITEM_NO_SECOND_BRACKET] = 'Missing a second opening square bracket.';
str[err.BRACKETITEM_NO_NAME] = 'Missing name in a "<![" item.';

str[err.DOCTYPE_NO_NAME] = 'Missing name for the document type.';
str[err.DOCTYPE_NAME_INVALID] = 'The document type name must match the syntax for names. Found: "{0}".';
str[err.DOCTYPE_NO_CLOSE] = 'Missing closing ">" for in the document type.';

str[err.ENTITYDECL_NO_NAME] = 'Missing name for an entity declaration.';
str[err.ENTITYDECL_NAME_INVALID] = 'The entity name must match the syntax for names. Found: "{0}".';
str[err.ENTITYDECL_NAME_NO_TRAILING_SPACE] = 'Missing space after the entity "{0}".';
str[err.ENTITYDECL_NDATA_NO_SPACE_BEFORE] = 'Missing space before NDATA in entity "{0}".';
str[err.ENTITYDECL_NDATA_INVALID_CASE] = 'NDATA in entity "{0}" must be upper case. Found "{1}".';
str[err.ENTITYDECL_NDATA_NO_NAME] = 'NDATA in entity "{0}" must have a name.';
str[err.ENTITYDECL_NO_VALUE] = 'Missing value or external identifier in entity "{0}".';
str[err.ENTITYDECL_NO_CLOSE] = 'Missing closing ">" in the entity "{0}".';

str[err.ELEMENTDECL_NO_NAME] = 'Missing name for an element declaration.';
str[err.ELEMENTDECL_NAME_INVALID] = 'The element declaration name must match the syntax for names. Found: "{0}".';
str[err.ELEMENTDECL_NO_SPEC] = 'Missing content spec for element declaration "{0}".';
str[err.ELEMENTDECL_SPEC_INVALID_CASE] = 'The content spec must be "{0}". Found "{1}".';
str[err.ELEMENTDECL_SPEC_UNKNOWN] = 'An unknown content spec was found. Found "{0}".';
str[err.ELEMENTDECL_SPEC_ITEMS_MISSING] = 'Missing items in the content spec in element declaration "{0}".';
str[err.ELEMENTDECL_SPEC_NO_NAMES] = 'Missing {0} name from the content spec in the element declaration "{1}".';
str[err.ELEMENTDECL_SPEC_NO_ORS] = 'Missing {0} "|" from the content spec in the element declaration "{1}".';
str[err.ELEMENTDECL_SPEC_NAME_INVALID] = 'Names in content spec must match the syntax for names. Found "{0}".';
str[err.ELEMENTDECL_PCDATA_NOT_FIRST] = '#PCDATA must be first in the content spec of element declaration "{0}".';
str[err.ELEMENTDECL_NO_SPEC_CLOSE] = 'Missing closing ")" for content spec in element declaration "{0}".';
str[err.ELEMENTDECL_NO_CLOSE] = 'Missing closing ">" in the element declaration "{0}".';

str[err.ATTLISTDECL_NO_NAME] = 'Missing element name in an attribute list declaration.';
str[err.ATTLISTDECL_NAME_INVALID] = 'The element name must match the syntax for names. Found "{0}".';
str[err.ATTLISTDECL_NO_ATTRIBUTES] = 'Missing attribute definitions for an attribute declaration for "{0}".';
str[err.ATTLISTDECL_ATTR_NAME_INVALID] = 'The attribute name must match the syntax for names. Found "{0}".';
str[err.ATTLISTDECL_ATTR_NO_TYPE] = 'Missing type for attribute "{0}" in the attribute declaration for "{1}".';
str[err.ATTLISTDECL_ATTR_TYPE_UNKNOWN] =
   'The type must be a standardized value in the attribute declaration for "{0}". Found "{1}".';
str[err.ATTLISTDECL_ATTR_TYPE_INVALID] =
   'The type "{0}" must be upper case in the attribute declaration for "{1}". Found "{2}".';
str[err.ATTLISTDECL_ATTR_NOTA_NAME_INVALID] = 'The name in the attribute declaration for "{0}"' +
   ' must match the syntax for names. Found "{1}".';
str[err.ATTLISTDECL_ATTR_NOTA_EMPTY] =
   'The notation in the attribute declaration for "{0}" must have one or more names.';
str[err.ATTLISTDECL_ATTR_NOTA_NO_SPACE] =
   'The notation in the attribute declaration for "{0}" must have a space before the name.';
str[err.ATTLISTDECL_ATTR_LIST_NO_NAMES] = 'Missing {0} name from the attribute declaration for "{1}".';
str[err.ATTLISTDECL_ATTR_LIST_NO_ORS] = 'Missing {0} "|" from the attribute declaration for "{1}".';
str[err.ATTLISTDECL_ATTR_NOTA_NO_CLOSE] = 'Missing closing ")" for the notation in the attribute definition for "{0}".';
str[err.ATTLISTDECL_ATTR_ENUM_NMTOKEN_INVALID] =
   'The value in the enumeration in the attribute declaration for "{0}" must match the syntax for nmtokens. ' +
   'Found "{1}".';
str[err.ATTLISTDECL_ATTR_ENUM_NO_CLOSE] =
   'Missing closing ")" for the enumeration in the attribute definition for "{0}".';
str[err.ATTLISTDECL_ATTR_NO_DEFAULT] =
   'Missing default value for attribute "{0}" in the attribute declaration for "{1}".';
str[err.ATTLISTDECL_ATTR_DEFAULT_NO_SPACE] =
   'Missing space before default for attribute "{0}" in the attribute declaration for "{1}".';
str[err.ATTLISTDECL_ATTR_DEFAULT_INVALID] =
   'The default "{0}" must be upper case in the attribute declaration for "{1}". Found "{2}".';
str[err.ATTLISTDECL_ATTR_DEFAULT_UNKNOWN] =
   'The default "{0}" must be one of the specified default values in attribute declaration for "{1}".';
str[err.ATTLISTDECL_FIXED_NO_SPACE] = 'Missing space after #FIXED in attribute declaration for "{0}".';
str[err.ATTLISTDECL_ATTR_INVALID] =
   'Must not have a "<" in an attribute value in the attribute list declaration for "{0}".';
str[err.ATTLISTDECL_ATTR_NO_CLOSE_QUOTE] = 'Missing closing quote in the attribute list declaration for "{0}".';
str[err.ATTLISTDECL_NO_CLOSE] = 'Missing closing ">" in the attribute list declaration "{0}".';

str[err.NOTATIONDECL_NO_NAME] = 'Missing name for a notation declaration.';
str[err.NOTATIONDECL_NAME_INVALID] = 'The notation declaration name must match the syntax for names. Found: "{0}".';
str[err.NOTATIONDECL_NO_EXTERNALID] = 'Missing the external id the notation declaration "{0}".';
str[err.NOTATIONDECL_NO_SPACE_AFTER_NAME] = 'Missing space after the name in the notation declaration "{0}".';
str[err.NOTATIONDECL_NO_CLOSE] = 'Missing closing ">" in the notation declaration "{0}".';

str[err.EXTERNALID_UNKNOWN] = 'The external id was an unknown type. Found "{0}".';
str[err.EXTERNALID_INVALID_CASE] = 'The "{0}" label must be all upper case. Found "{1}".';
str[err.EXTERNALID_NO_PUBLIC] = 'Missing public literal.';
str[err.EXTERNALID_NO_SYSTEM] = 'Missing system literal.';
str[err.EXTERNALID_PUBLIC_NO_SPACE] = 'Missing space beteen the public and the system literals.';
str[err.EXTERNALID_PUBLIC_NO_LEADING_SPACE] = 'Missing space beteen PUBLIC and the literal.';
str[err.EXTERNALID_PUBLIC_INVALID_CHARS] = 'The public literal has invalid charaters. Found "{0}".';
str[err.EXTERNALID_PUBLIC_NO_QUOTE] = 'Missing quotes around the public literal.';
str[err.EXTERNALID_SYSTEM_NO_LEADING_SPACE] = 'Missing space beteen SYSTEM and the literal.';
str[err.EXTERNALID_SYSTEM_NO_QUOTE] = 'Missing quotes around the system literal.';

module.exports = XmlErrorToken;
