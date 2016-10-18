/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const XmlToken = require('./XmlToken.js');

class XmlErrorToken extends XmlToken {

   /**********************************************************************\
    XmlErrorToken holds inforamtion about some kind of error.

    PARAM
    type: The type of the token (ERROR)
    code: The error code
    message: A message about the error
    place: an Offset describing where the error happened when parsing.
    context: an array of Offsets, each describing where the start of a
      syntactic element was when the error happened.  For example, if parsing
      encountered
            <blah error>
      the first Offset would be the location of the <.  If this was in the
      body of an entity being processed, the next Offset would be the start
      of that entity reference, and if that, in turn, was in another, the
      next Offset would be the start of that reference, and so on.
   \**********************************************************************/

   constructor(type, code, message, place, context) {
      super(type, '');
      this.type = type;
      this.code = code;
      this.message = message;
      this.place = place;
      this.context = context;
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
   XMLDECL_INVALID_CONTEXT: 'XMLDECL_INVALID_CONTEXT',

   TEXTDECL_XTRA_STANDALONE: 'TEXTDECL_XTRA_STANDALONE',
   TEXTDECL_NO_ENCODING: 'TEXTDECL_NO_ENCODING',

   PI_SPACE_BEFORE_TARGET: 'PI_SPACE_BEFORE_TARGET',
   PI_TARGET_NAME_INVALID: 'PI_TARGET_NAME_INVALID',
   PI_NO_CLOSE: 'PI_NO_CLOSE',
   PI_NO_TARGET: 'PI_NO_TARGET',
   PI_INVALID_CONTEXT: 'PI_INVALID_CONTEXT',

   COMMENT_NO_CLOSE: 'COMMENT_NO_CLOSE',
   COMMENT_ENDS_WITH_HYPHEN: 'COMMENT_ENDS_WITH_HYPHEN',
   COMMENT_INVALID_CONTEXT: 'COMMENT_INVALID_CONTEXT',

   ELEMENT_UNBALANCED: 'ELEMENT_UNBALANCED',
   ELEMENT_XTRA_LEADING_SPACE: 'ELEMENT_XTRA_LEADING_SPACE',
   ELEMENT_NO_NAME: 'ELEMENT_NO_NAME',
   ELEMENT_NAME_INVALID: 'ELEMENT_NAME_INVALID',
   ELEMENT_NO_CLOSE: 'ELEMENT_NO_CLOSE',
   ELEMENT_BAD_CLOSE: 'ELEMENT_BAD_CLOSE',
   ELEMENT_END_INVALID_CLOSE: 'ELEMENT_END_INVALID_CLOSE',
   ELEMENT_INVALID_DOC_CONTEXT: 'ELEMENT_INVALID_DOC_CONTEXT',
   ELEMENT_INVALID_DTD_CONTEXT: 'ELEMENT_INVALID_DTD_CONTEXT',

   ATTRIBUTE_INVALID_NAME: 'ATTRIBUTE_INVALID_NAME',
   ATTRIBUTE_NO_SPACE_BEFORE_NAME: 'ATTRIBUTE_NO_SPACE_BEFORE_NAME',
   ATTRIBUTE_NO_EQUAL: 'ATTRIBUTE_NO_EQUAL',
   ATTRIBUTE_NO_VALUE: 'ATTRIBUTE_NO_VALUE',
   ATTRIBUTE_NO_QUOTE: 'ATTRIBUTE_NO_QUOTE',
   ATTRIBUTE_NO_CLOSE_QUOTE: 'ATTRIBUTE_NO_CLOSE_QUOTE',
   ATTRIBUTE_INVALID_VALUE: 'ATTRIBUTE_INVALID_VALUE',

   SPACE_INVALID_CONTEXT: 'SPACE_INVALID_CONTEXT',

   CHARDATA_INVALID_TEXT: 'CHARDATA_INVALID_TEXT',
   CHARDATA_INVALID_SUBSET_CONTEXT: 'CHARDATA_INVALID_SUBSET_CONTEXT',
   CHARDATA_INVALID_DOC_CONTEXT: 'CHARDATA_INVALID_DOC_CONTEXT',

   CDATA_NO_CLOSE: 'CDATA_NO_CLOSE',
   CDATA_XTRA_SPACE_BEFORE: 'CDATA_XTRA_SPACE_BEFORE',
   CDATA_XTRA_SPACE_AFTER: 'CDATA_XTRA_SPACE_AFTER',
   CDATA_INVALID_CASE: 'CDATA_INVALID_CASE',
   CDATA_INVALID_SUBSET_CONTEXT: 'CDATA_INVALID_SUBSET_CONTEXT',
   CDATA_INVALID_DOC_CONTEXT: 'CDATA_INVALID_DOC_CONTEXT',

   REFERENCE_NO_NAME: 'REFERENCE_NO_NAME',
   REFERENCE_NO_SEMICOLON: 'REFERENCE_NO_SEMICOLON',
   REFERENCE_XTRA_SPACE: 'REFERENCE_XTRA_SPACE',
   REFERENCE_XTRA_TRAILING_SPACE: 'REFERENCE_XTRA_TRAILING_SPACE',
   REFERENCE_INVALID_SUBSET_CONTEXT: 'REFERENCE_INVALID_SUBSET_CONTEXT',
   REFERENCE_INVALID_DOC_CONTEXT: 'REFERENCE_INVALID_DOC_CONTEXT',

   CHARREF_XTRA_SPACE: 'CHARREF_XTRA_SPACE',
   CHARREF_INVALID_HEX_CASE: 'CHARREF_INVALID_HEX_CASE',
   CHARREF_XTRA_SPACE_BEFORE_DIGITS: 'CHARREF_XTRA_SPACE_BEFORE_DIGITS',
   CHARREF_NO_DIGITS: 'CHARREF_NO_DIGITS',
   CHARREF_XTRA_SPACE_AFTER_DIGITS: 'CHARREF_XTRA_SPACE_AFTER_DIGITS',
   CHARREF_NO_SEMICOLON: 'CHARREF_NO_SEMICOLON',
   CHARREF_INVALID_BASE: 'CHARREF_INVALID_BASE',
   CHARREF_INVALID_SUBSET_CONTEXT: 'CHARREF_INVALID_SUBSET_CONTEXT',
   CHARREF_INVALID_DOC_CONTEXT: 'CHARREF_INVALID_DOC_CONTEXT',

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
   DOCTYPE_INVALID_DOC_CONTEXT: 'DOCTYPE_INVALID_DOC_CONTEXT',
   DOCTYPE_INVALID_EXTERNAL_CONTEXT: 'DOCTYPE_INVALID_EXTERNAL_CONTEXT',

   ENTITYDECL_NO_NAME: '.ENTITYDECL_NO_NAME',
   EXTERNALID_INVALID_CASE: 'EXTERNALID_INVALID_CASE',
   ENTITYDECL_NAME_INVALID: 'ENTITYDECL_NAME_INVALID',
   ENTITYDECL_NAME_NO_TRAILING_SPACE: 'ENTITYDECL_NAME_NO_TRAILING_SPACE',
   ENTITYDECL_NDATA_NO_SPACE_BEFORE: 'ENTITYDECL_NDATA_NO_SPACE_BEFORE',
   ENTITYDECL_NDATA_INVALID_CASE: 'ENTITYDECL_NDATA_INVALID_CASE',
   ENTITYDECL_NDATA_NO_NAME: 'ENTITYDECL_NDATA_NO_NAME',
   ENTITYDECL_NO_VALUE: 'ENTITYDECL_NO_VALUE',
   ENTITYDECL_NO_CLOSE: 'ENTITYDECL_NO_CLOSE',
   ENTITYDECL_INVALID_CONTEXT: 'ENTITYDECL_INVALID_CONTEXT',

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
   ELEMENTDECL_INVALID_CONTEXT: 'ELEMENTDECL_INVALID_CONTEXT',

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
   ATTLISTDECL_ATTR_ENUM_NO_PRESPACE: 'ATTLISTDECL_ATTR_ENUM_NO_PRESPACE',
   ATTLISTDECL_ATTR_ENUM_NO_CLOSE: 'ATTLISTDECL_ATTR_ENUM_NO_CLOSE',
   ATTLISTDECL_ATTR_NO_DEFAULT: 'ATTLISTDECL_ATTR_NO_DEFAULT',
   ATTLISTDECL_ATTR_DEFAULT_NO_SPACE: 'ATTLISTDECL_ATTR_DEFAULT_NO_SPACE',
   ATTLISTDECL_ATTR_DEFAULT_INVALID: 'ATTLISTDECL_ATTR_DEFAULT_INVALID',
   ATTLISTDECL_ATTR_DEFAULT_UNKNOWN: 'ATTLISTDECL_ATTR_DEFAULT_UNKNOWN',
   ATTLISTDECL_FIXED_NO_SPACE: 'ATTLISTDECL_FIXED_NO_SPACE',
   ATTLISTDECL_ATTR_FIXED_NO_VALUE: 'ATTLISTDECL_ATTR_FIXED_NO_VALUE',
   ATTLISTDECL_ATTR_INVALID: 'ATTLISTDECL_ATTR_INVALID',
   ATTLISTDECL_ATTR_NO_CLOSE_QUOTE: 'ATTLISTDECL_ATTR_NO_CLOSE_QUOTE',
   ATTLISTDECL_NO_CLOSE: 'ATTLISTDECL_NO_CLOSE',
   ATTLISTDECL_INVALID_CONTEXT: 'ATTLISTDECL_INVALID_CONTEXT',

   NOTATIONDECL_NO_NAME: 'NOTATIONDECL_NO_NAME',
   NOTATIONDECL_NAME_INVALID: 'NOTATIONDECL_NAME_INVALID',
   NOTATIONDECL_NO_EXTERNALID: 'NOTATIONDECL_NO_EXTERNALID',
   NOTATIONDECL_NO_SPACE_AFTER_NAME: 'NOTATIONDECL_NO_SPACE_AFTER_NAME',
   NOTATIONDECL_NO_CLOSE: 'NOTATIONDECL_NO_CLOSE',
   NOTATIONDECL_INVALID_CONTEXT: 'NOTATIONDECL_INVALID_CONTEXT',

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
str[err.XMLDECL_NO_ATTRIBUTES] = 'Missing version in an XML or Text Declaration.';
str[err.XMLDECL_NO_CLOSE] = 'Missing closing "?>" in an XML or Text Declaration.';
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
str[err.XMLDECL_INVALID_CONTEXT] = 'An XML or Text Declaration must be the first thing in the entity.';

str[err.TEXTDECL_XTRA_STANDALONE] = '"standalone" must not be in a Text Declaration.';
str[err.TEXTDECL_NO_ENCODING] = '"encoding" must be in a Text Declaration.';

str[err.PI_SPACE_BEFORE_TARGET] = 'Must not have a space before the target name.';
str[err.PI_NO_TARGET] = 'Missing target name in a processing instruction.';
str[err.PI_TARGET_NAME_INVALID] = 'The target name must match the syntax for names. Found: "{0}".';
str[err.PI_NO_CLOSE] = 'Missing closing ?> in a processing instruction.';
str[err.PI_INVALID_CONTEXT] = 'A processing instruction must not be the first thing in the document entity.';

str[err.COMMENT_NO_CLOSE] = 'Missing closing --> in a comment.';
str[err.COMMENT_ENDS_WITH_HYPHEN] = 'Must not have a hyphen at end of a comment.';
str[err.COMMENT_INVALID_CONTEXT] = 'A comment must not be the first thing in the document entity.';

str[err.ELEMENT_UNBALANCED] = 'Expected end tag "{0}". Found "{1}".';
str[err.ELEMENT_XTRA_LEADING_SPACE] = 'Must not have space after opening "<" of an element tag.';
str[err.ELEMENT_NO_NAME] = 'Missing name in element tag.';
str[err.ELEMENT_NAME_INVALID] = 'The element tag name must match the syntax for names. Found: "{0}".';
str[err.ELEMENT_NO_CLOSE] = 'Missing closing of element tag.';
str[err.ELEMENT_END_INVALID_CLOSE] = 'End element tag must close with ">". Found "/>".';
str[err.ELEMENT_INVALID_DOC_CONTEXT] = 'An element must not be before the Xml Declaration. Found "{0}".';
str[err.ELEMENT_INVALID_DTD_CONTEXT] = 'An element must not be in the internal or external subset. Found "{0}".';

str[err.ATTRIBUTE_INVALID_NAME] = 'The attribute name must match the syntax for names. Found: "{0}".';
str[err.ATTRIBUTE_NO_SPACE_BEFORE_NAME] = '"{0}" must have a space before it.';
str[err.ATTRIBUTE_NO_EQUAL] = '"{0}" must be followed by an "=".';
str[err.ATTRIBUTE_NO_VALUE] = '"{0}" must have a value.';
str[err.ATTRIBUTE_NO_QUOTE] = 'The value for "{0}" must be quoted.';
str[err.ATTRIBUTE_NO_CLOSE_QUOTE] = 'The value for "{0}" must close with a quote.';
str[err.ATTRIBUTE_INVALID_VALUE] = 'The value of attribute "{0}" must not contain "<".';

str[err.SPACE_INVALID_CONTEXT] = 'The XML Declaration must appear before any content in the document entity.';
str[err.CHARDATA_INVALID_TEXT] = '"]]>" must not appear in in character data.';
str[err.CHARDATA_INVALID_SUBSET_CONTEXT] = 'CharData must not be in the external subset. Found "{0}".';
str[err.CHARDATA_INVALID_DOC_CONTEXT] = 'CharData must not be outside the content of the document entity. Found "{0}".';

str[err.CDATA_INVALID_CASE] = '"CDATA" must be capitalized. Found "{0}".';
str[err.CDATA_XTRA_SPACE_BEFORE] = 'Must not have space before CDATA.';
str[err.CDATA_XTRA_SPACE_AFTER] = 'Must not have space after CDATA.';
str[err.CDATA_NO_CLOSE] = 'Missing closing "]]>" in CDATA section.';
str[err.CDATA_INVALID_SUBSET_CONTEXT] = 'A CDATA must not be in the external subset.';
str[err.CDATA_INVALID_DOC_CONTEXT] = 'A CDATA must not be outside the content of the document entity.';

str[err.REFERENCE_NO_NAME] = 'Missing name in entity reference.';
str[err.REFERENCE_NO_SEMICOLON] = 'Missing semicolon after entity reference "{0}".';
str[err.REFERENCE_XTRA_SPACE] = 'Must not have space in an entity reference.';
str[err.REFERENCE_XTRA_TRAILING_SPACE] = 'Must not have a space after the entity reference "{0}".';
str[err.REFERENCE_INVALID_SUBSET_CONTEXT] = 'An entity reference must not be in the external subset.';
str[err.REFERENCE_INVALID_DOC_CONTEXT] = 'An entity reference must not be outside the content of the document entity.';

str[err.CHARREF_XTRA_SPACE] = 'Must not have a space after the "#" in a character reference.';
str[err.CHARREF_INVALID_HEX_CASE] = '"x" in a hexadecimal character reference must be lower case.';
str[err.CHARREF_XTRA_SPACE_BEFORE_DIGITS] = 'Must not have spaces before digits in a character reference.';
str[err.CHARREF_NO_DIGITS] = 'Missing digits in a character reference.';
str[err.CHARREF_XTRA_SPACE_AFTER_DIGITS] = 'Must not have spaces after digits in a character reference.';
str[err.CHARREF_NO_SEMICOLON] = 'Must have a ";" after a character reference.';
str[err.CHARREF_INVALID_BASE] = 'A decimal character reference must not contain hex digits. Found "{0}".';
str[err.CHARREF_INVALID_SUBSET_CONTEXT] = 'A character reference must not be in the external subset.';
str[err.CHARREF_INVALID_DOC_CONTEXT] = 'A character reference must not be outside the content of the document entity.';

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
str[err.DOCTYPE_INVALID_DOC_CONTEXT] = 'A DOCTYPE must be declared once between the XML Declaration and the content.';
str[err.DOCTYPE_INVALID_EXTERNAL_CONTEXT] = 'A DOCTYPE must not be declared in an external entity.';

str[err.ENTITYDECL_NO_NAME] = 'Missing name for an entity declaration.';
str[err.ENTITYDECL_NAME_INVALID] = 'The entity name must match the syntax for names. Found: "{0}".';
str[err.ENTITYDECL_NAME_NO_TRAILING_SPACE] = 'Missing space after the entity "{0}".';
str[err.ENTITYDECL_NDATA_NO_SPACE_BEFORE] = 'Missing space before NDATA in entity "{0}".';
str[err.ENTITYDECL_NDATA_INVALID_CASE] = 'NDATA in entity "{0}" must be upper case. Found "{1}".';
str[err.ENTITYDECL_NDATA_NO_NAME] = 'NDATA in entity "{0}" must have a name.';
str[err.ENTITYDECL_NO_VALUE] = 'Missing value or external identifier in entity "{0}".';
str[err.ENTITYDECL_NO_CLOSE] = 'Missing closing ">" in the entity "{0}".';
str[err.ENTITYDECL_INVALID_CONTEXT] = 'An entity must not be declared outside of the internal or external subset.';

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
str[err.ELEMENTDECL_INVALID_CONTEXT] = 'An element must not be declared outside of the internal or external subset.';

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
str[err.ATTLISTDECL_ATTR_ENUM_NO_PRESPACE] = 'Must have a space before enumeration in attribute declaration for "{0}".';
str[err.ATTLISTDECL_ATTR_NO_DEFAULT] =
   'Missing default value for attribute "{0}" in the attribute declaration for "{1}".';
str[err.ATTLISTDECL_ATTR_DEFAULT_NO_SPACE] =
   'Missing space before default for attribute "{0}" in the attribute declaration for "{1}".';
str[err.ATTLISTDECL_ATTR_DEFAULT_INVALID] =
   'The default "{0}" must be upper case in the attribute declaration for "{1}". Found "{2}".';
str[err.ATTLISTDECL_ATTR_DEFAULT_UNKNOWN] =
   'The default "{0}" must be one of the specified default values in attribute declaration for "{1}".';
str[err.ATTLISTDECL_FIXED_NO_SPACE] = 'Missing space after #FIXED in attribute declaration for "{0}".';
str[err.ATTLISTDECL_ATTR_FIXED_NO_VALUE] = 'Must have a value after #FIXED in attribute declaration for "{0}".';
str[err.ATTLISTDECL_ATTR_INVALID] =
   'Must not have a "<" in an attribute value in the attribute list declaration for "{0}".';
str[err.ATTLISTDECL_ATTR_NO_CLOSE_QUOTE] = 'Missing closing quote in the attribute list declaration for "{0}".';
str[err.ATTLISTDECL_NO_CLOSE] = 'Missing closing ">" in the attribute list declaration "{0}".';
str[err.ATTLISTDECL_INVALID_CONTEXT] =
   'An attribute list must not be declared outside of the internal or external subset.';

str[err.NOTATIONDECL_NO_NAME] = 'Missing name for a notation declaration.';
str[err.NOTATIONDECL_NAME_INVALID] = 'The notation declaration name must match the syntax for names. Found: "{0}".';
str[err.NOTATIONDECL_NO_EXTERNALID] = 'Missing the external id the notation declaration "{0}".';
str[err.NOTATIONDECL_NO_SPACE_AFTER_NAME] = 'Missing space after the name in the notation declaration "{0}".';
str[err.NOTATIONDECL_NO_CLOSE] = 'Missing closing ">" in the notation declaration "{0}".';
str[err.NOTATIONDECL_INVALID_CONTEXT] = 'A notation must not be declared outside of the internal or external subset.';

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
