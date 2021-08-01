/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCodes } from 'basic';

const validityConstraint = new ErrorCodes({
   ATTLISTDECL_BAD_ENTITIES_DEFAULT: {
      code: 1127,
      message:
         'The names in the default for the ENTITIES attribute "{1}" of attribute list declaration "{0}" must match the syntax for names (§3.3.2). Found "{2}".',
   },
   ATTLISTDECL_BAD_ENTITY_DEFAULT: {
      code: 1128,
      message:
         'The default for the ENTITY attribute "{1}" of attribute list declaration "{0}" must match the syntax for names (§3.3.2). Found "{2}".',
   },
   ATTLISTDECL_BAD_ENUMERATION_DEFAULT: {
      code: 1129,
      message:
         'The default for the attribute "{1}" of attribute list declaration "{0}" must have one of these values: {2} (§3.3.2). Found "{3}".',
   },
   ATTLISTDECL_BAD_IDREF_DEFAULT: {
      code: 1131,
      message:
         'The default for the IDREF attribute "{1}" of attribute list declaration "{0}" must match the syntax for names (§3.3.2). Found "{2}".',
   },
   ATTLISTDECL_BAD_IDREFS_DEFAULT: {
      code: 1132,
      message:
         'The names in the default for the IDREFS attribute "{1}" of attribute list declaration "{0}" must match the syntax for names (§3.3.2). Found "{2}".',
   },
   ATTLISTDECL_BAD_NMTOKEN_DEFAULT: {
      code: 1133,
      message:
         'The default for the NMTOKEN attribute "{1}" of attribute list declaration "{0}" must match the syntax for name tokens (§3.3.2). Found "{2}".',
   },
   ATTLISTDECL_BAD_NMTOKENS_DEFAULT: {
      code: 1134,
      message:
         'The names in the default for the NMTOKENS attribute "{1}" of attribute list declaration "{0}" must match the syntax for name tokens (§3.3.2). Found "{2}".',
   },
   ATTLISTDECL_BAD_NOTATION: {
      code: 1111,
      message:
         'The attribute "{1}" of attribute list declaration "{0}" must name NOTATIONs that have been declared (§3.3.1). Found "{2}".',
   },
   ATTLISTDECL_BAD_NOTATION_DEFAULT: {
      code: 1135,
      message:
         'The default for the attribute "{1}" of attribute list declaration "{0}" must have one of these values: {2} (§3.3.2). Found "{3}".',
   },
   ATTLISTDECL_DUPLICATE_ENUMERATION: {
      code: 1113,
      message:
         'Must not have duplicate enumeration values on the "{1}" attribute of element "{0}" (§3.3.1). Found "{2}".',
   },
   ATTLISTDECL_DUPLICATE_NOTATION: {
      code: 1114,
      message:
         'Must not have duplicate NOTATION values on the "{1}" attribute of element "{0}" (§3.3.1). Found "{2}".',
   },
   ATTLISTDECL_EMPTY_NOTATION: {
      code: 1110,
      message:
         'Must not have an attribute of type NOTATION on an EMPTY element "{0}" (§3.3.1). Found "{1}".',
   },
   ATTLISTDECL_EXTRA_ID: {
      code: 1119,
      message:
         'Must not have more than one attribute of type ID for the element type "{0}" (§3.3.1). Found: "{1}", while previous ID attribute was "{2}".',
   },
   ATTLISTDECL_EXTRA_NOTATION: {
      code: 1115,
      message:
         'Must not have more than one attribute of type NOTATION for the element type "{0}" (§3.3.1). Found "{1}".',
   },
   ATTLISTDECL_ID_BAD_DEFAULT: {
      code: 1120,
      message:
         'The default type for attribute "{1}" of attribute list declaration "{0}" must be "#IMPLIED" or "#REQUIRED" (§3.3.1). Found: "{2}".',
   },
   ATTLISTDECL_TYPE_EXTERNAL_DECLARED: {
      code: 1137,
      message:
         'The attribute "{1}" for element type "{0}" was declared externally, and its value will not be able to be accurately reported when standalone="yes" (§2.9.0).',
   },
   CONTENT_CONTAINS_INVALID_ELEMENT: {
      code: 1140,
      message:
         'Found an element type, "{1}" in an "{0}" elment at a position it is not allowed (§3.0.0).',
   },
   CONTENT_IN_ANY_ELEMENT: {
      code: 1144,
      message:
         'Found invalid syntax in an ANY element "{0}", which is not allowed there in XML {1}/{2} (§3.0.0). Found {3}.',
   },
   CONTENT_IN_ELEMENT_ELEMENT: {
      code: 1141,
      message:
         'Found invalid syntax in the element type "{0}", which is not allowed there in XML {1}/{2} (§3.0.0). Found {3}.',
   },
   CONTENT_IN_EMPTY_ELEMENT: {
      code: 1139,
      message: 'Found content in an element that should be empty ("{0}") (§3.0.0).',
   },
   CONTENT_IN_MIXED_ELEMENT: {
      code: 1143,
      message:
         'Found syntax in a MIXED element "{0}" that is not allowed in {1}/{2} (§3.0.0). Found {3}.',
   },
   CONTENT_MIXED_CONTAINS_INVALID_ELEMENT: {
      code: 1142,
      message:
         'Found an element that was not declared in the "{0}" element declaration (§3.0.0). Found "{1}".',
   },
   CONTENT_XTRA_SPACE: {
      code: 1142,
      message:
         'Must not have space before the first child element or after the last child element of a "{0}" in version 1.0/1. (§3.0.0).',
   },
   ELEMENT_CONTENT_SPACE_EXTERNAL_DECLARED: {
      code: 1136,
      message:
         'Found whitespace in element content for an element "{0}" that was externally declared when standalone=yes (§2.9.0).',
   },
   ELEMENT_EXTRA_DECLARATION: {
      code: 1125,
      message:
         'There must be only one declaration for a particular element type (§3.2.0). Found "{0}".',
   },
   ELEMENT_MISMATCH_ROOT_TYPE: {
      code: 1101,
      message:
         'The name of the root element must match the type "{0}" in the document type declaration (§2.8.0). Found "{1}".',
   },
   ELEMENT_UNDECLARED: {
      code: 1147,
      message: ' Element found without a corresponding declaration (§3.0.0). Found "{0}".',
   },
   ELEMENTDECL_MIXED_DUPLICATE_NAME: {
      code: 1124,
      message:
         'The Mixed content spec for element declaration "{0}" must not have the same type specified multiple times (§3.2.2). Found: "{1}".',
   },
   ELEMENTDECL_PEREF_PARENS_UNBALANCED: {
      code: 1148,
      message:
         'The replacement text for the parameter entity "{1}" was not properly nested in the element declaration "{0}" (§3.2.1).',
   },
   ELEMENTSTART_DEFAULT_EXTERNAL_DECLARED: {
      code: 1138,
      message:
         'The attribute "{1}" on element "{0}" was declared externally, but the document is marked as standalone="yes" (§2.9.0). Found: "{0}".',
   },
   ELEMENTSTART_ENTITIES_NO_ENTITY: {
      code: 1108,
      message:
         'The ENTITIES value for attribute "{2}" of element "{1}" names one or more entities that were not declared (§3.3.1). Found: "{0}".',
   },
   ELEMENTSTART_ENTITIES_NOT_NAME: {
      code: 0,
      message:
         'The ENTITIES value for attribute "{2}" of element "{1}" must match the syntax for names (§3.3.1). Found "{0}".',
   },
   ELEMENTSTART_ENTITIES_PARSED_ENTITY: {
      code: 1109,
      message:
         'The ENTITIES value for attribute "{2}" of element "{1}" names one or more parsed entities (§3.3.1). Found unparsed: "{0}".',
   },
   ELEMENTSTART_ENTITY_NO_ENTITY: {
      code: 1106,
      message:
         'The ENTITY value for attribute "{2}" of element "{1}" must name an unparsed declared entity (§3.3.1). Found "{0}".',
   },
   ELEMENTSTART_ENTITY_NOT_NAME: {
      code: 0,
      message:
         'The ENTITY value for attribute "{2}" of element "{1}" must match the syntax for names (§3.3.1). Found "{0}".',
   },
   ELEMENTSTART_ENTITY_PARSED_ENTITY: {
      code: 1107,
      message:
         'The ENTITY value for attribute "{2}" of element "{1}" must name an unparsed declared entity (§3.3.1). Found "{0}".',
   },
   ELEMENTSTART_ENUMERATION_NOT_DECLARED: {
      code: 1116,
      message:
         'The enumeration value for attribute "{1}" of element "{0}" must be one of the values declared ({2}). (§3.3.1). Found "{3}".',
   },
   ELEMENTSTART_ID_DUPLICATE: {
      code: 1118,
      message:
         'The ID value "{4}" must only be used once in a document. Found on attribute "{1}" of element type "{0}" when earlier used on attribute "{3}" of element type "{2}" (§3.3.1). Found: "{2}".',
   },
   ELEMENTSTART_ID_NAME_INVALID: {
      code: 1117,
      message:
         'The ID value for attribute "{1}" of element "{0}" must match the syntax for names (§3.3.1). Found: "{2}".',
   },
   ELEMENTSTART_IDREF_NO_ID: {
      code: 1123,
      message:
         'The attribute "{1}" of element "{0}" refers to an ID that is not in the document (§3.3.1). Found: "{2}".',
   },
   ELEMENTSTART_IDREF_NOT_NAME: {
      code: 1121,
      message:
         'The IDREF value for attribute "{1}" of element "{0}" must match the syntax for names (§3.3.1). Found: "{2}".',
   },
   ELEMENTSTART_IDREFS_NOT_NAME: {
      code: 1122,
      message:
         'The IDREFS value for attribute "{1}" of element "{0}" must match the syntax for names (§3.3.1). Found: "{2}".',
   },
   ELEMENTSTART_INVALID_FIXED: {
      code: 1130,
      message: 'Attribe "{1}" on element "{0}" must have a value of "{2}". (§3.3.2). Found "{3}".',
   },
   ELEMENTSTART_NMTOKEN_NOT_NMTOKEN: {
      code: 1104,
      message:
         'The NMTOKEN value for attribute "{2}" of element "{1}" must match the syntax for a name token (§3.3.1). Found: "{0}".',
   },
   ELEMENTSTART_NMTOKENS_NOT_NMTOKEN: {
      code: 1105,
      message:
         'The NMTOKENS value for attribute "{2}" of element "{1}" must match the syntax for name tokens (§3.3.1). Found: "{0}".',
   },
   ELEMENTSTART_NO_REQUIRED: {
      code: 1126,
      message: 'The required attribute "{1}" missing on element "{0}".',
   },
   ELEMENTSTART_NOTATION_NOT_DECLARED: {
      code: 1112,
      message:
         'The NOTATION value for attribute "{1}" of element "{0}" must be one of the values declared ({2}) (§3.3.1). Found "{3}".',
   },
   ELEMENTSTART_UNDECLARED_ATTRIBUTE: {
      code: 1126,
      message: 'Attributes for element "{0}" must be declared (§3.1.0). Found "{1}".',
   },
   ENTITYDECL_UNDECLARED_NOTATION: {
      code: 1103,
      message:
         'The declaration of the entity "{0}" must not have an undeclared NDATA value (§4.2.2). Found "{1}".',
   },
   ENTITYREF_EXTERNALLY_DECLARED: {
      code: 1138,
      message:
         'The entity "{0}" was declared externally, but was referenced in this document which is standalone="yes" (§2.9.0).',
   },
   NOTATION_XTRA_DECLARATION: {
      code: 1102,
      message: 'Must not declare a NOTATION more than once (§4.7.0). Found "{0}".',
   },
   PEREF_INVALID_CONDITIONAL_END_NESTING: {
      code: 1131,
      message:
         'The last character of a conditional section must not be found in the replacement text of a parameter entity reference when the first was not also there (§2.8.0).',
   },
   PEREF_INVALID_CONDITIONAL_START_NESTING: {
      code: 1132,
      message:
         'The first character ("<") of a conditional section must not be found in the replacement text of a parameter entity reference when the last (">") was not also there (§2.8.0).',
   },
   PEREF_INVALID_END_NESTING: {
      code: 1126,
      message:
         'The last character of a {0} declaration must not be found in the replacement text of a parameter entity reference when the first was not also there (§2.8.0).',
   },
   PEREF_INVALID_START_NESTING: {
      code: 1127,
      message:
         'The first character ("<") of a {0} declaration must not be found in the replacement text of a parameter entity reference when the last (">") was not also there (§2.8.0).',
   },
});

export { validityConstraint };
