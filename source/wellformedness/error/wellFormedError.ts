/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ProblemPosition, Problem, FATAL_ERROR_SEVERITY, ProblemCodes } from 'basic';

const wellFormedErrorCodes = new ProblemCodes({
   NOUN_TEXTDECL: {
      code: -1,
      message: 'a Text Declaration',
   },
   NOUN_XMLDECL: {
      code: -2,
      message: 'an XML Declaration',
   },
   NOUN_EXTERNALID_SYSTEM: {
      code: -3,
      message: 'an ExternalID',
   },
   NOUN_ENTITYVALUE: {
      code: -4,
      message: 'an entity literal value',
   },
   NOUN_ATTRIBUTE: {
      code: -6,
      message: 'an attribute',
   },
   NOUN_XMLDECL_PARAM: {
      code: -5,
      message: 'a parameter to an XML Declaration',
   },
   NOUN_EXTERNALID_PUBLIC: {
      code: -7,
      message: 'an ExternalID',
   },
   CHARSET_UTF16_NO_BOM: {
      code: 1001,
      message: 'Missing BOM in UTF-16 input.',
   },
   INTERNAL_ERROR: {
      code: 1002,
      message: 'An internal error happened: {0}.',
   },
   TOKEN_INVALID_CONTEXT: {
      code: 1003,
      message: 'The token ({0}) must not be used in this location.',
   },
   DOC_END_EARLY: {
      code: 1004,
      message:
         'The document ended early (expected at least an XML Declaration followed by an element).',
   },
   XMLDECL_NO_PARAMS: {
      code: 1101,
      message: 'Missing version in an Xml Declaration.',
   },
   XMLDECL_NO_CLOSE: {
      code: 1102,
      message: 'Missing closing "?>" in an XML Declaration.',
   },
   XMLDECL_PARAM_INVALID_CASE: {
      code: 1103,
      message: '"{0}" must be lower case. Found "{1}".',
   },
   XMLDECL_PARAM_UNKNOWN: {
      code: 1104,
      message: 'Unknown XML Declaration parameter "{0}".',
   },
   XMLDECL_TARGET_INVALID_CASE: {
      code: 1105,
      message: '"xml" must be lower case. Found "{0}".',
   },
   XMLDECL_VERSION_INVALD: {
      code: 1106,
      message: '"version" must be {0}. Found "{1}".',
   },
   XMLDECL_VERSION_INVALID_ORDER: {
      code: 1107,
      message: '"version" must be the first parameter.',
   },
   XMLDECL_ENCODING_INVALID: {
      code: 1108,
      message: '"encoding" must be alphanumeric. Found "{0}".',
   },
   XMLDECL_ENCODING_INVALID_ORDER: {
      code: 1109,
      message: '"encoding" must be after "version" and before "standalone".',
   },
   XMLDECL_STANDALONE_INVALID_CASE: {
      code: 1110,
      message: '"{0}" must be lower case. Found "{1}".',
   },
   XMLDECL_STANDALONE_INVALID: {
      code: 1111,
      message: '"standalone" must be "yes" or "no". Found "{0}".',
   },
   XMLDECL_STANDALONE_INVALID_ORDER: {
      code: 1112,
      message: '"standalone" must come after "version".',
   },
   XMLDECL_INVALID_CONTEXT: {
      code: 1113,
      message: 'An XML Declaration must be the first thing in the entity.',
   },
   XMLDECL_SPACE_AFTER_OPEN: {
      code: 1114,
      message: 'Must not have a space before the "xml" name.',
   },
   XMLDECL_NO_TARGET: {
      code: 1115,
      message: 'Missing "xml" in an XML Declaration.',
   },
   XMLDECL_NO_SPACE_AFTER_TARGET: {
      code: 1116,
      message: 'Must have a space after the "xml".',
   },
   XMLDECL_NO_SPACE_BETWEEN_PARAMS: {
      code: 1117,
      message: 'Must have a space before "{0}".',
   },
   XMLDECL_ENCODING_NO_EQUAL: {
      code: 1118,
      message: '"encoding" must be followed by an "=".',
   },
   XMLDECL_DUPLICATE_VERSION: {
      code: 1119,
      message: '"version" may only be specified one time in an XML Declaration.',
   },
   XMLDECL_DUPLICATE_ENCODING: {
      code: 1120,
      message: '"encoding" may only be specified one time in an XML Declaration.',
   },
   XMLDECL_DUPLICATE_STANDALONE: {
      code: 1121,
      message: '"standalone" may only be specified one time in an XML Declaration.',
   },
   TEXTDECL_SPACE_AFTER_OPEN: {
      code: 1201,
      message: 'Must not have a space before the "xml" name.',
   },
   TEXTDECL_NO_TARGET: {
      code: 1202,
      message: 'Missing "xml" in an Text Declaration.',
   },
   TEXTDECL_NO_SPACE_AFTER_TARGET: {
      code: 1203,
      message: 'Must not have a space after the "xml".',
   },
   TEXTDECL_NO_CLOSE: {
      code: 1204,
      message: 'Missing closing "?>" in a Text Declaration.',
   },
   TEXTDECL_PARAM_INVALID_CASE: {
      code: 1205,
      message: '"{0}" must be lower case. Found "{1}".',
   },
   TEXTDECL_INVALID_CONTEXT: {
      code: 1209,
      message: 'A Text Declaration must be the first thing in the entity.',
   },
   TEXTDECL_VERSION_INVALD: {
      code: 1206,
      message: '"version" must be {0}. Found "{1}".',
   },
   TEXTDECL_VERSION_INVALID_ORDER: {
      code: 1207,
      message: '"version" must be the first parameter.',
   },
   TEXTDECL_ENCODING_INVALID: {
      code: 1208,
      message: '"encoding" must be alphanumeric. Found "{0}".',
   },
   TEXTDECL_TARGET_INVALID_CASE: {
      code: 1210,
      message: '"xml" must be lower case. Found "{0}".',
   },
   TEXTDECL_DUPLICATE_VERSION: {
      code: 1211,
      message: '"version" may only be specified one time in a text Declaration.',
   },
   TEXTDECL_DUPLICATE_ENCODING: {
      code: 1212,
      message: '"encoding" may only be specified one time in a text Declaration.',
   },
   TEXTDECL_ENCODING_MISSING: {
      code: 1213,
      message: 'Missing "encoding".',
   },
   PI_SPACE_AFTER_OPEN: {
      code: 1301,
      message: 'Must not have a space before the target ("{0}") name.',
   },
   PI_NO_TARGET: {
      code: 1302,
      message: 'Missing target name in a processing instruction.',
   },
   PI_NO_SPACE_AFTER_TARGET: {
      code: 1304,
      message: 'Must not have a space after the target name ("{0}").',
   },
   PI_TARGET_HAS_XML: {
      code: 1303,
      message: 'Must not have (X|x)(M|m)((L|l) anywhere in the target name. Found "{0}".',
   },
   PI_NO_CLOSE: {
      code: 1305,
      message: 'Missing closing ?> in a processing instruction for the target "{0}".',
   },
   PI_INVALID_CONTEXT: {
      code: 1306,
      message: 'A processing instruction must not be the first thing in the document entity.',
   },
   PI_TARGET_NAME_INVALID: {
      code: 1307,
      message: 'A processing instruction target must match the syntax for names. Found: "{0}".',
   },
   COMMENT_NO_CLOSE: {
      code: 1401,
      message: 'Missing closing --> in a comment.',
   },
   COMMENT_ENDS_WITH_HYPHEN: {
      code: 1402,
      message: 'Must not have a hyphen at end of a comment.',
   },
   COMMENT_DOUBLE_HYPHEN: {
      code: 1403,
      message: 'Must not have a double hyphen ("--") in a comment.',
   },
   COMMENT_INVALID_CONTEXT: {
      code: 1404,
      message: 'A comment must not be the first thing in the document entity.',
   },
   ELEMENT_UNBALANCED: {
      code: 1501,
      message: 'Expected end tag "{0}". Found "{1}".',
   },
   ELEMENT_XTRA_LEADING_SPACE: {
      code: 1502,
      message: 'Must not have space after opening "<" of an element tag.',
   },
   ELEMENT_NO_NAME: {
      code: 1503,
      message: 'Missing name in element tag.',
   },
   ELEMENT_NAME_INVALID: {
      code: 1504,
      message: 'The element tag name must match the syntax for names. Found: "{0}".',
   },
   ELEMENT_NO_CLOSE: {
      code: 1505,
      message: 'Missing closing of element tag.',
   },
   ELEMENT_END_INVALID_CLOSE: {
      code: 1506,
      message: 'End element tag must close with ">". Found "/>".',
   },
   ELEMENT_INVALID_DOC_CONTEXT: {
      code: 1507,
      message: 'An element must not be before the Xml Declaration.',
   },
   ATTRIBUTE_INVALID_NAME: {
      code: 1601,
      message: 'The attribute name must match the syntax for names. Found: "{0}".',
   },
   ATTRIBUTE_NO_SPACE_BEFORE_NAME: {
      code: 1602,
      message: '"{0}" must have a space before it.',
   },
   ATTRIBUTE_NO_EQUAL: {
      code: 1603,
      message: '"{0}" must be followed by an "=".',
   },
   ATTRIBUTE_NO_VALUE: {
      code: 1604,
      message: '"{0}" must have a value.',
   },
   ATTRIBUTE_NO_QUOTE: {
      code: 1605,
      message: 'The value for "{0}" must be quoted.',
   },
   ATTRIBUTE_NO_CLOSE_QUOTE: {
      code: 1606,
      message: 'The value for "{0}" must close with a quote.',
   },
   ATTRIBUTE_INVALID_VALUE: {
      code: 1607,
      message: 'The value of attribute "{0}" must not contain "<".',
   },
   ATTRIBUTE_DUPLICATE_NAME: {
      code: 1608,
      message: 'An element may not use the same attribute name twice. Found "{0}".',
   },
   ATTRIBUTE_INVALID_REFERENCE: {
      code: 1609,
      message:
         'An attribute may not, directly or indirectly, contain a reference to an external entity. Found "{0}".',
   },
   ATTRIBUTE_LANG_BAD_CODE: {
      code: 1610,
      message:
         'The language code in an xml:lang attribute was not syntactically correct.  Found "{0}".',
   },
   ATTRIBUTE_REFERENCE_UNBALANCED: {
      code: 1611,
      message: 'Found the end of entity "{0}" when expected to find "{1}".',
   },
   ATTRIBUTE_INVALID_EXTERNAL_REFERENCE: {
      code: 1612,
      message:
         'The attribute {0} has a reference to the entity {1} which has an external value, which is not allowed.',
   },
   SPACE_INVALID_CONTEXT: {
      code: 1701,
      message: 'The XML Declaration must appear before any content in the document entity.',
   },
   CHARDATA_INVALID_TEXT: {
      code: 1801,
      message: '"]]>" must not appear in in character data.',
   },
   CHARDATA_INVALID_SUBSET_CONTEXT: {
      code: 1802,
      message: 'CharData must not be in the external subset. Found "{0}".',
   },
   CHARDATA_INVALID_DOC_CONTEXT: {
      code: 1803,
      message: 'CharData must not be outside the content of the document entity. Found "{0}".',
   },
   CHARDATA_INVALID_CHAR: {
      code: 1804,
      message: 'Characters that do not match the syntax for XML document found at: {0}.',
   },
   CHARDATA_INVALID_SECTION_END: {
      code: 1805,
      message: 'The string "]]>" may not appear unescaped in content (§2.4.0).',
   },
   CDATA_NO_CLOSE: {
      code: 1904,
      message: 'Missing closing "]]>" in CDATA section.',
   },
   CDATA_INVALID_SUBSET_CONTEXT: {
      code: 1905,
      message: 'A CDATA must not be in the external subset.',
   },
   CDATA_INVALID_DOC_CONTEXT: {
      code: 1906,
      message: 'A CDATA must not be outside the content of the document entity.',
   },
   CDATA_XTRA_SPACE_AFTER_OPEN: {
      code: 1907,
      message: 'Must not have space after the "<![" in a "{0}".',
   },
   CDATA_XTRA_SPACE_AFTER_TYPE: {
      code: 1908,
      message: 'Must not have space after the "{0}".',
   },
   CDATA_UNKNOWN: {
      code: 1910,
      message: 'Unknown section. Found "{0}".',
   },
   CDATA_NO_SECOND_BRACKET: {
      code: 1911,
      message: 'Missing a second opening square bracket for "{0}".',
   },
   CDATA_NO_TYPE: {
      code: 1912,
      message: 'Missing CDATA text.',
   },
   CDATA_INVALID_CASE: {
      code: 1909,
      message: '"{0}" must be upper case. Found "{1}".',
   },
   REFERENCE_NO_NAME: {
      code: 2001,
      message: 'Missing name in entity reference.',
   },
   REFERENCE_NO_SEMICOLON: {
      code: 2002,
      message: 'Missing semicolon after entity reference "{0}".',
   },
   REFERENCE_XTRA_SPACE: {
      code: 2003,
      message: 'Must not have space in the entity reference "{0}".',
   },
   REFERENCE_XTRA_TRAILING_SPACE: {
      code: 2004,
      message: 'Must not have a space after the entity reference "{0}".',
   },
   REFERENCE_INVALID_SUBSET_CONTEXT: {
      code: 2005,
      message: 'An entity reference must not be in the internal subset.',
   },
   REFERENCE_INVALID_DOC_CONTEXT: {
      code: 2006,
      message: 'An entity reference must not be outside the content of the document entity.',
   },
   REFERENCE_NO_DECLARATION: {
      code: 2007,
      message: 'Missing declaration for entity "{0}".',
   },
   REFERENCE_NAME_INVALID: {
      code: 2008,
      message: 'The general entity reference name must match the syntax for names. Found: "{0}".',
   },
   REFERENCE_UNPARSED_NO_USE: {
      code: 2009,
      message:
         'The unparsed entity ("{0}") may only be used in ENTITY or ENTITIES attribute values.',
   },
   REFERENCE_INVALID_RECURSION: {
      code: 2010,
      message: 'An entity reference must not be recursively referenced. Found "{0}".',
   },
   REFERENCE_INVALID_STANDALONE: {
      code: 2011,
      message:
         'Must not reference an entity declared in the external subset when standalone="yes". Found a reference to "{0}".',
   },
   REFERENCE_INVALID_CHARS: {
      code: 2013,
      message: 'Must not specify a lone "&" or "%" in an entity value. Found "{0}".',
   },
   REFERENCE_INVALID_SYNTAX: {
      code: 2012,
      message: 'Must specify syntactically correct general entity references. Found "{0}".',
   },
   PEREF_NO_NAME: {
      code: 2020,
      message: 'Missing name in parameter entity reference.',
   },
   PEREF_NO_SEMICOLON: {
      code: 2021,
      message: 'Missing semicolon after parameter entity reference "{0}".',
   },
   PEREF_XTRA_SPACE: {
      code: 2022,
      message: 'Must not have space in the parameter entity reference "{0}".',
   },
   PEREF_XTRA_TRAILING_SPACE: {
      code: 2023,
      message: 'Must not have a space after the parameter entity reference "{0}".',
   },
   PEREF_INVALID_ENTITYVALUE_CONTEXT: {
      code: 2024,
      message:
         'Must not have a parameter entity reference in an entity value in the internal subset. Found "{0}".',
   },
   PEREF_INVALID_CONTEXT: {
      code: 2025,
      message: 'Must not have a parameter entity reference outside of a DTD. Found "{0}".',
   },
   PEREF_NAME_INVALID: {
      code: 2026,
      message: 'The parameter entity reference name must match the syntax for names. Found: "{0}".',
   },
   PEREF_INVALID_RECURSION: {
      code: 2027,
      message: 'A parameter entity reference must not be recursively referenced. Found "{0}".',
   },
   CHARREF_XTRA_POST_OPEN_SPACE: {
      code: 2101,
      message: 'Must not have a space after the opening &#.',
   },
   CHARREF_INVALID_HEX_CASE: {
      code: 2111,
      message: '"x" in a hexadecimal character reference must be lower case.',
   },
   CHARREF_XTRA_POST_HEX_SPACE: {
      code: 2112,
      message: "Must not have spaces after the 'x' in a character reference.",
   },
   CHARREF_NO_DIGITS: {
      code: 2113,
      message: 'Missing digits in a character reference.',
   },
   CHARREF_XTRA_POST_DIGITS_SPACE: {
      code: 2114,
      message: 'Must not have spaces after digits in a character reference.',
   },
   CHARREF_NO_CLOSE: {
      code: 2115,
      message: 'Must have a ";" after a character reference.',
   },
   CHARREF_INVALID_DOC_CONTEXT: {
      code: 2119,
      message:
         'A character reference must not be outside the content of the document entity (except in entity value declarations or default attribute values).',
   },
   CHARREF_INVALID_CHAR: {
      code: 2116,
      message:
         'The character reference must be a legal Char, according to the XML definition of Char. Found #{0};',
   },
   CHARREF_INVALID_SUBSET_CONTEXT: {
      code: 2118,
      message: 'A character reference must not be in the external subset.',
   },
   DECL_UNKNOWN: {
      code: 2201,
      message: 'Unkown "<!" item. Found "{0}"',
   },
   DECL_OPEN_XTRA_SPACE_AFTER: {
      code: 2202,
      message: 'Must not have space before the name in a "<!" item.',
   },
   DECL_NO_DECLTYPE: {
      code: 2203,
      message: 'Must have a name for a "<!" item.',
   },
   DECL_DECLTYPE_INVALID_CASE: {
      code: 2204,
      message: '"{0}" must be upper case. Found "{1}".',
   },
   DECL_TYPE_NO_SPACE_AFTER: {
      code: 2205,
      message: 'There must be a space after the declaration type "{0}".',
   },
   DOCTYPE_NO_NAME: {
      code: 3101,
      message: 'Missing name for the document type.',
   },
   DOCTYPE_NAME_INVALID: {
      code: 3102,
      message: 'The document type name must match the syntax for names. Found: "{0}".',
   },
   DOCTYPE_NO_CLOSE: {
      code: 3103,
      message: 'Missing closing ">" for in the document type.',
   },
   DOCTYPE_INVALID_DOC_CONTEXT: {
      code: 3104,
      message: 'A DOCTYPE must be declared once between the XML Declaration and the content.',
   },
   DOCTYPE_INVALID_EXTERNAL_CONTEXT: {
      code: 3105,
      message: 'A DOCTYPE must not be declared in an external entity.',
   },
   DOCTYPE_INVALID_SUBSET_CLOSE: {
      code: 3106,
      message: 'A DOCTYPE must not have a "]" without an opening "[".',
   },
   ENTITYDECL_NO_NAME: {
      code: 3201,
      message: 'Missing name for an entity declaration.',
   },
   ENTITYDECL_NAME_INVALID: {
      code: 3202,
      message: 'The entity name must match the syntax for names. Found: "{0}".',
   },
   ENTITYDECL_NAME_NO_TRAILING_SPACE: {
      code: 3203,
      message: 'Missing space after the entity "{0}".',
   },
   ENTITYDECL_PERCENT_NO_TRAILING_SPACE: {
      code: 3204,
      message: 'Missing space after the % in entity declaration "{0}".',
   },
   ENTITYDECL_NDATA_INVALID_CASE: {
      code: 3205,
      message: 'NDATA in entity "{0}" must be upper case. Found "{1}".',
   },
   ENTITYDECL_NDATA_NO_NAME: {
      code: 3206,
      message: 'NDATA in entity "{0}" must have a name.',
   },
   ENTITYDECL_NO_VALUE: {
      code: 3207,
      message: 'Missing value or external identifier in entity "{0}".',
   },
   ENTITYDECL_NO_CLOSE: {
      code: 3208,
      message: 'Missing closing ">" in the entity "{0}".',
   },
   ENTITYDECL_INVALID_CONTEXT: {
      code: 3209,
      message: 'An entity must not be declared outside of the internal or external subset.',
   },
   ENTITYDECL_EXTRA_TEXT: {
      code: 3210,
      message: 'Extra text found in the entity declaration. Found {0}.',
   },
   ENTITYDECL_DECLTYPE_INVALID: {
      code: 3211,
      message: 'The entity declaration should start with "ENTITY". Found "{0}".',
   },
   ENTITYDECL_DECLTYPE_NO_SPACE_AFTER: {
      code: 3212,
      message: 'There must be a space after the declaration type "{0}".',
   },
   ENTITYDECL_OPEN_XTRA_SPACE_AFTER: {
      code: 3213,
      message: 'There must be a space after the <!.',
   },
   ENTITYDECL_EXTERNALID_NO_SPACE: {
      code: 3612,
      message: 'Missing space after the external ID for entity "{0}".',
   },
   EXTERNALID_MISSING_PUBLIC_VALUE: {
      code: 3613,
      message: 'Missing public literal.',
   },
   EXTERNALID_MISSING_SYSTEM_VALUE: {
      code: 3614,
      message: 'Missing system literal.',
   },
   ELEMENTDECL_OPEN_XTRA_SPACE_AFTER: {
      code: 3307,
      message: 'There must be a space after the <!.',
   },
   ELEMENTDECL_DECLTYPE_INVALID: {
      code: 3308,
      message: 'Declaration type must be "ELEMENT". Found "{0}".',
   },
   ELEMENTDECL_DECLTYPE_NO_SPACE: {
      code: 3309,
      message: 'Must have space after the ELEMENT.',
   },
   ELEMENTDECL_NO_NAME: {
      code: 3301,
      message: 'Missing name for an element declaration.',
   },
   ELEMENTDECL_NAME_INVALID: {
      code: 3302,
      message: 'The element declaration name must match the syntax for names. Found: "{0}".',
   },
   ELEMENTDECL_NAME_NO_SPACE: {
      code: 3314,
      message: 'Missing space after the name in the element declaration "{0}".',
   },
   ELEMENTDECL_NO_CLOSE: {
      code: 3312,
      message: 'Missing closing ">" in the element declaration "{0}".',
   },
   ELEMENTDECL_EXTRA_TEXT: {
      code: 3315,
      message: 'Extra text found in the elmenent declaration. Found {0}.',
   },
   ELEMENTDECL_NO_SPEC: {
      code: 3303,
      message: 'Missing content spec for element declaration "{0}".',
   },
   ELEMENTDECL_SPEC_INVALID_CASE: {
      code: 3304,
      message: 'The content spec for element declaration "{0}" must be "{1}". Found "{2}".',
   },
   ELEMENTDECL_SPEC_UNKNOWN: {
      code: 3305,
      message: 'An unknown content spec was found for element declaration "{0}". Found "{1}".',
   },
   ELEMENTDECL_INVALID_CONTEXT: {
      code: 3313,
      message: 'An element must not be declared outside of the internal or external subset.',
   },
   ATTLISTDECL_DECLTYPE_INVALID: {
      code: 3436,
      message: 'The attribute declaration type must be "ATTLIST". Found: "{0}".',
   },
   ATTLISTDECL_NO_ELEMENT_NAME: {
      code: 3401,
      message: 'Missing element name in an attribute list declaration.',
   },
   ATTLISTDECL_ELEMENT_NAME_INVALID: {
      code: 3402,
      message: 'The element name must match the syntax for names. Found "{0}".',
   },
   ATTLISTDECL_ELEMENT_NAME_NO_TRAILING_SPACE: {
      code: 3427,
      message: 'The element name must be followed by a space.',
   },
   ATTLISTDECL_ATTR_NAME_INVALID: {
      code: 3404,
      message: 'The attribute name must match the syntax for names. Found "{0}".',
   },
   ATTLISTDECL_ATTR_NAME_NO_SPACE: {
      code: 3428,
      message: 'Missing space after attribute name "{0}" in attribute list declaration "{1}".',
   },
   ATTLISTDECL_ATTR_NO_TYPE: {
      code: 3405,
      message: 'Missing type for attribute "{0}" in the attribute declaration for "{1}".',
   },
   ATTLISTDECL_ATTR_TYPE_UNKNOWN: {
      code: 3406,
      message:
         'The type must be a standardized value in the "{0}" attribute declaration for "{1}". Found "{2}".',
   },
   ATTLISTDECL_ATTR_TYPE_INVALID: {
      code: 3407,
      message:
         'The type must be upper case in the "{0}" attribute declaration for "{1}". Found "{2}".',
   },
   ATTLISTDECL_ATTR_TYPE_NO_SPACE: {
      code: 3429,
      message:
         'Missing space after attribute "{0}" with type "{1}" in attribute list declaration "{2}".',
   },
   ATTLISTDECL_ATTR_NO_ATTTYPE: {
      code: 3431,
      message: 'Missing attribute type for attribute "{0}" in the attribute declaration for "{1}".',
   },
   ATTLISTDECL_ATTR_NO_ENUMERATION_SPACE: {
      code: 3432,
      message:
         'Missing space after enumeration for attribute "{0}" in the attribute declaration for "{1}".',
   },
   ATTLISTDECL_ATTR_NO_NOTATION: {
      code: 3433,
      message: 'Missing NOTATION list for attribute "{0}" in the attribute declaration for "{1}".',
   },
   ATTLISTDECL_ATTR_NO_NOTATION_SPACE: {
      code: 3434,
      message:
         'Missing space after the NOTATION list for attribute "{0}" in the attribute declaration for "{1}".',
   },
   ATTLISTDECL_ATTR_DEFAULT_INVALID: {
      code: 3419,
      message: 'The default "{2}" must be upper case in the "{0}" attribute declaration for "{1}".',
   },
   ATTLISTDECL_ATTR_DEFAULT_UNKNOWN: {
      code: 3420,
      message:
         'The default "{2}" must be one of the specified default values in "{0}" attribute declaration for "{1}".',
   },
   ATTLISTDECL_ATTR_FIXED_NO_SPACE: {
      code: 3421,
      message: 'Missing space after #FIXED in "{0}" attribute declaration for "{1}".',
   },
   ATTLISTDECL_ATTR_EXTRA_VALUE: {
      code: 3430,
      message: 'Extra value found for attribute "{0}" in the attribute declaration for "{1}".',
   },
   ATTLISTDECL_ATTR_NO_VALUE: {
      code: 3417,
      message: 'Missing default value for attribute "{0}" in the attribute declaration for "{1}".',
   },
   ATTLISTDECL_ATTR_FIXED_NO_VALUE: {
      code: 3422,
      message: 'Must have a value after #FIXED in "{0}" attribute declaration for "{1}".',
   },
   ATTLISTDECL_NO_CLOSE: {
      code: 3425,
      message: 'Missing closing ">" in the attribute list declaration "{0}".',
   },
   ATTLISTDECL_EXTRA_TEXT: {
      code: 3435,
      message: 'Extra text found in the attribute list declaration. Found {0}.',
   },
   NOUN_NOTATION_LIST: {
      code: -10,
      message: 'NOTATION list',
   },
   NOUN_ENUMERATION_LIST: {
      code: -11,
      message: 'ENUMERATION list',
   },
   CONTENTMODEL_NO_OPEN: {
      code: 3819,
      message: 'Must have an "(" to start the list.',
   },
   CONTENTMODEL_NO_NAMES: {
      code: 3801,
      message: 'Must have at least one value for the children.',
   },
   CONTENTMODEL_NO_NAME: {
      code: 3802,
      message: 'Missing the name for entry {0} of children.',
   },
   CONTENTMODEL_NAME_INVALID: {
      code: 3803,
      message: 'The name must match the syntax for names. Found "{0}"',
   },
   CONTENTMODEL_NO_DELIM: {
      code: 3804,
      message: 'Missing the separator for the entry {0} of children.',
   },
   CONTENTMODEL_EXTRA_DELIM: {
      code: 3805,
      message: 'Extra separator for the entry {0} of children.',
   },
   CONTENTMODEL_NO_CLOSE: {
      code: 3806,
      message: 'Missing close ")" for the children.',
   },
   CONTENTMODEL_BAD_SEQUENCE: {
      code: 3807,
      message: 'Expected a "," separator for the entry {0} of children. Found "{1}"',
   },
   CONTENTMODEL_BAD_CHOICE: {
      code: 3808,
      message: 'Expected a "|" for the entry {0} of children. Found "{1}"',
   },
   CONTENTMODEL_PCDATA_INVALID_CASE: {
      code: 3809,
      message: '#PCDATA must be upper case. Found "{0}"',
   },
   CONTENTMODEL_NAME_EXTRA_SPACE: {
      code: 3817,
      message:
         'A space must not be placed after a name and before the repeat indicator. Found at {0}.',
   },
   CONTENTMODEL_MIXED_NAME_EXTRA_REPEAT: {
      code: 3816,
      message:
         'A "Mixed" content spec must not have a repeat indicator after the name at {0}. Found {1}.',
   },
   CONTENTMODEL_MIXED_EXTRA_REPEAT: {
      code: 3810,
      message:
         'A "Mixed" content spec must not end with any repeat marker if it has only #PCDATA in it. Found "{0}".',
   },
   CONTENTMODEL_MIXED_INVALID_REPEAT: {
      code: 3811,
      message:
         'A "Mixed" content spec must end with "*", unless it contains just "#PCDATA" in which case it may have no repeat. Found "{0}".',
   },
   CONTENTMODEL_MIXED_INVALID_SUBPARTICLE: {
      code: 3812,
      message: 'A "Mixed" content spec may not contain sub-list. Found one at {0}.',
   },
   CONTENTMODEL_CLOSE_EXTRA_SPACE: {
      code: 3818,
      message: 'A space must not be placed between the ")" and the repeat marker.',
   },
   NAMELIST_NO_OPEN: {
      code: 93819,
      message: 'Must have an "(" to start the list.',
   },
   NAMELIST_NO_NAMES: {
      code: 93801,
      message: 'Must have at least one value for the children.',
   },
   NAMELIST_NO_NAME: {
      code: 93802,
      message: 'Missing the name for entry {1} of children.',
   },
   NAMELIST_NAME_INVALID: {
      code: 93803,
      message: 'The name must match the syntax for names. Found "{0}"',
   },
   NAMELIST_NO_DELIM: {
      code: 93804,
      message: 'Missing the separator for the entry {0} of children.',
   },
   NAMELIST_EXTRA_DELIM: {
      code: 93805,
      message: 'Extra separator for the entry {0} of children.',
   },
   NAMELIST_NO_CLOSE: {
      code: 93806,
      message: 'Missing close ")" for the children.',
   },
   NAMELIST_BAD_SEQUENCE: {
      code: 93807,
      message: 'Expected a "," separator for the entry {0} of children. Found "{1}"',
   },
   NAMELIST_BAD_CHOICE: {
      code: 93808,
      message: 'Expected a "|" for the entry {0} of children. Found "{1}"',
   },
   NAMELIST_PCDATA_INVALID_CASE: {
      code: 93809,
      message: '#PCDATA must be upper case. Found "{0}"',
   },
   NAMELIST_NAME_EXTRA_SPACE: {
      code: 93817,
      message:
         'A space must not be placed after a name and before the repeat indicator. Found at {0}.',
   },
   NAMELIST_MIXED_NAME_EXTRA_REPEAT: {
      code: 93816,
      message:
         'A "Mixed" content spec must not have a repeat indicator after the name at {0}. Found {1}.',
   },
   NAMELIST_MIXED_EXTRA_REPEAT: {
      code: 93810,
      message:
         'A "Mixed" content spec must not end with any repeat marker if it has only #PCDATA in it. Found "{0}".',
   },
   NAMELIST_MIXED_INVALID_REPEAT: {
      code: 93811,
      message:
         'A "Mixed" content spec must end with "*" when there are multiple names in it. Found "{1}".',
   },
   NAMELIST_MIXED_INVALID_SUBPARTICLE: {
      code: 93812,
      message: 'A "Mixed" content spec may not contain sub-list. Found one at {0}.',
   },
   NAMELIST_CLOSE_EXTRA_SPACE: {
      code: 93818,
      message: 'A space must not be placed between the ")" and the repeat marker.',
   },
   WORDLIST_NO_WORDS: {
      code: 3850,
      message: 'Must have at least one name in the enumeration.',
   },
   WORDLIST_NO_WORD: {
      code: 3851,
      message: 'Missing the name for entry {0} of the enumeration.',
   },
   WORDLIST_INVALID_NAME: {
      code: 3852,
      message: 'The name must match the syntax for names. Found "{0}".',
   },
   WORDLIST_INVALID_NMTOKEN: {
      code: 3853,
      message: 'The name must match the syntax for nmTokens. Found "{0}".',
   },
   WORDLIST_NO_CONNECTOR: {
      code: 3854,
      message: 'Missing connector after entry {0} of the enumeration.',
   },
   WORDLIST_NO_CLOSE: {
      code: 3855,
      message: 'Missing close ")" for the enumeration.',
   },
   ATTLISTDECL_ATTR_NOTA_NAME_INVALID: {
      code: 3408,
      message:
         'The name in the attribute declaration must match the syntax for names. Found "{0}".',
   },
   ATTLISTDECL_ATTR_NOTA_EMPTY: {
      code: 3409,
      message: 'The notation in the attribute declaration for "{0}" must have one or more names.',
   },
   ATTLISTDECL_ATTR_NOTA_NO_SPACE: {
      code: 3410,
      message:
         'The notation in the attribute declaration for "{0}" must have a space before the name.',
   },
   ATTLISTDECL_ATTR_LIST_NO_NAMES: {
      code: 3411,
      message: 'Missing {0} name from the attribute declaration for "{1}".',
   },
   ATTLISTDECL_ATTR_LIST_NO_ORS: {
      code: 3412,
      message: 'Missing {0} "|" from the attribute declaration for "{1}".',
   },
   ATTLISTDECL_ATTR_NOTA_NO_CLOSE: {
      code: 3413,
      message: 'Missing closing ")" for the notation in the attribute definition for "{0}".',
   },
   ATTLISTDECL_ATTR_ENUM_NMTOKEN_INVALID: {
      code: 3414,
      message:
         'The value in the enumeration in the attribute declaration must match the syntax for nmtokens. Found "{0}".',
   },
   ATTLISTDECL_ATTR_ENUM_NO_CLOSE: {
      code: 3415,
      message: 'Missing closing ")" for the enumeration in the attribute definition for "{0}".',
   },
   ATTLISTDECL_ATTR_ENUM_NO_PRESPACE: {
      code: 3416,
      message: 'Must have a space before enumeration in attribute declaration for "{0}".',
   },
   ATTLISTDECL_ATTR_INVALID: {
      code: 3423,
      message:
         'Must not have a "<" in an attribute value in the attribute list declaration for "{0}".',
   },
   ATTLISTDECL_ATTR_NO_CLOSE_QUOTE: {
      code: 3424,
      message: 'Missing closing quote in the attribute list declaration for "{0}".',
   },
   ATTLISTDECL_INVALID_CONTEXT: {
      code: 3426,
      message: 'An attribute list must not be declared outside of the internal or external subset.',
   },
   NOTATIONDECL_NO_NAME: {
      code: 3501,
      message: 'Missing name for a notation declaration.',
   },
   NOTATIONDECL_NAME_INVALID: {
      code: 3502,
      message: 'The notation declaration name must match the syntax for names. Found: "{0}".',
   },
   NOTATIONDECL_NAME_NO_SPACE: {
      code: 3504,
      message: 'Missing space after the name in the notation declaration "{0}".',
   },
   NOTATIONDECL_NO_EXTERNALID: {
      code: 3503,
      message: 'Missing the external ID in a notation declaration.',
   },
   NOTATIONDECL_NO_CLOSE: {
      code: 3505,
      message: 'Missing closing ">" in the notation declaration "{0}".',
   },
   NOTATIONDECL_INVALID_CONTEXT: {
      code: 3506,
      message: 'A notation must not be declared outside of the internal or external subset.',
   },
   NOTATIONDECL_EXTRA_TEXT: {
      code: 3507,
      message: 'Extra text found in a notation declaration. Found {0}.',
   },
   NOTATIONDECL_OPEN_XTRA_SPACE_AFTER: {
      code: 3508,
      message: 'Must not have space before the NOTATION.',
   },
   NOTATIONDECL_DECLTYPE_INVALID: {
      code: 3510,
      message: 'Declaration type must be "NOTATION". Found "{0}".',
   },
   EXTERNALID_UNKNOWN: {
      code: 3601,
      message: 'The external id was an unknown type. Found "{0}".',
   },
   EXTERNALID_INVALID_CASE: {
      code: 3602,
      message: 'The "{0}" label must be all upper case. Found "{1}".',
   },
   EXTERNALID_EXTERNALTYPE_NO_SPACE: {
      code: 3603,
      message: 'Missing space after the type.',
   },
   EXTERNALID_PUBLIC_NO_SPACE: {
      code: 3606,
      message: 'Missing space beteen the public and the system literals.',
   },
   EXTERNALID_PUBLIC_INVALID_CHARS: {
      code: 3607,
      message: 'The public literal has invalid charaters. Found "{0}".',
   },
   EXTERNALID_SYSTEM_NO_LEADING_SPACE: {
      code: 3610,
      message: 'Missing space beteen SYSTEM and the literal.',
   },
   EXTERNALID_EXTRA_TEXT: {
      code: 3611,
      message: 'Extra text found in the Exteral ID. Found {0}.',
   },
   CONDITIONAL_UNKNOWN: {
      code: 3650,
      message: 'The conditional section had an unknown type. Found "{0}"',
   },
   CONDITIONAL_INVALID_CASE: {
      code: 3651,
      message: 'The conditional section type should be "{1}". Found "{0}"',
   },
   CONDITIONAL_NO_SECOND_BRACKET: {
      code: 3652,
      message: 'Missing a second opening square bracket.',
   },
   CONDITIONAL_NO_CLOSE: {
      code: 3653,
      message: 'Missing closing "]]>" for conditional section.',
   },
   LITERAL_NO_OPEN_QUOTE: {
      code: 3701,
      message: 'Missing open quote around {0}',
   },
   LITERAL_NO_CLOSE_QUOTE: {
      code: 3703,
      message: 'Missing close quote around {0}',
   },
   PREDEFINED_EXTERNAL: {
      code: 3902,
      message: 'When declared, the entity "{0}" must be declared as an internal entity.',
   },
   PREDEFINED_INVALD: {
      code: 3903,
      message: 'The entity "{0}" must be declared as a character reference or a character.',
   },
   CONTENT_INVALID_TOKEN: {
      code: 3904,
      message: 'Found a token ("{0}")in the wrong context in the document.',
   },
   MARKUPDECL_INVALID_TOKEN: {
      code: 3095,
      message: 'Found a token ("{0}")in the wrong context in the document.',
   },
});

class WellFormedError extends Problem {
   constructor(
      id: string,
      params?: ReadonlyArray<string | number | boolean>,
      place?: ProblemPosition,
      context?: ProblemPosition,
   ) {
      super(wellFormedErrorCodes, FATAL_ERROR_SEVERITY, 'wellformed', id, params, place, context);
   }
}

export { WellFormedError, wellFormedErrorCodes };
