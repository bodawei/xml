/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ProblemCodes } from 'basic';

// Recall, can not remove a key once we hit 1.0
// Note: We get codes 1100-1299
// Formats
// THING(_SUBTHING)(_problem) = "THING must WHATEVER. Found OTHER"
// THING_NO_(whatever) = "Missing WHATEVER in a THING"
// THING_XTRA_... = "Must not..."

const validityErrorCodes = new ProblemCodes({
   ATTLISTDECL_ATT_EXTERNAL: {
      code: 1102,
      message:
         'The ATTLIST declaration for "{0}" with an attribute, "{1}", must not be be externally declared when standalone="yes" (§2.9.0).',
   },
   ATTLISTDECL_ATT_INVALID_ENTITIES_DEFAULT: {
      code: 1104,
      message:
         'The ATTLIST declaration for "{0}" has an ENTITIES attribute, "{1}", with a default value that must match the syntax for names (§3.3.2). Found "{2}".',
   },
   ATTLISTDECL_ATT_INVALID_ENTITY_DEFAULT: {
      code: 1106,
      message:
         'The ATTLIST declaration for "{0}" has an ENTITY attribute, "{1}", with a default value that must match the syntax for names (§3.3.2). Found "{2}".',
   },
   ATTLISTDECL_ATT_INVALID_ENUMERATION_DEFAULT: {
      code: 1108,
      message:
         'The ATTLIST declaration for "{0}" has an attribute, "{1}", which must have a default which is one of these values: {2} (§3.3.2). Found "{3}".',
   },
   ATTLISTDECL_ATT_INVALID_ID_DEFAULT: {
      code: 1110,
      message:
         'The ATTLIST declaration for "{0}" has an ID attribute, "{1}", with a default that must be "#IMPLIED" or "#REQUIRED" (§3.3.1). Found "{2}".',
   },
   ATTLISTDECL_ATT_INVALID_IDREF_DEFAULT: {
      code: 1112,
      message:
         'The ATTLIST declaration for "{0}" has an IDREF attribute, "{1}", with a default value that must match the syntax for names (§3.3.2). Found "{2}".',
   },
   ATTLISTDECL_ATT_INVALID_IDREFS_DEFAULT: {
      code: 1114,
      message:
         'The ATTLIST declaration for "{0}" has an IDREFS attribute, "{1}", with a default value that must match the syntax for names (§3.3.2). Found "{2}".',
   },
   ATTLISTDECL_ATT_INVALID_NMTOKEN_DEFAULT: {
      code: 1116,
      message:
         'The ATTLIST declaration for "{0}" has an NMTOKEN attribute, "{1}", with a default value that must match the syntax for name token (§3.3.2). Found "{2}".',
   },
   ATTLISTDECL_ATT_INVALID_NMTOKENS_DEFAULT: {
      code: 1118,
      message:
         'The ATTLIST declaration for "{0}" has an NMTOKENS attribute, "{1}", with a default value that must match the syntax for name tokens (§3.3.2). Found "{2}".',
   },
   ATTLISTDECL_ATT_INVALID_NOTATION_DEFAULT: {
      code: 1120,
      message:
         'The ATTLIST declaration for "{0}" has an attribute, "{1}", which must have a default which is one of these values: {2} (§3.3.2). Found "{3}".',
   },
   ATTLISTDECL_ATT_INVALID_NOTATION_ON_EMPTY: {
      code: 1122,
      message:
         'The ATTLIST declaration for the EMPTY element type "{0}" must not have an attribute "{1}" of type NOTATION (§3.3.2).',
   },
   ATTLISTDECL_ATT_NOTATION_NO_DECLARATION: {
      code: 1124,
      message:
         'Missing NOTATION declaration for the attribute "{1}" in the ATTLIST declaration for "{0}" (§3.3.1). Found "{2}".',
   },
   ATTLISTDECL_ATT_XTRA_ENUMERATION_VALUE: {
      code: 1126,
      message:
         'Must not have duplicate enumeration values multiple times for the attribute "{1}" in the ATTLIST declaration for "{0}" (§3.3.1). Found "{2}".',
   },
   ATTLISTDECL_ATT_XTRA_ID: {
      code: 1128,
      message:
         'Must not have more than one attribute of type ID for the element type "{0}" (§3.3.1). Found: "{1}", while previous ID attribute was "{2}".',
   },
   ATTLISTDECL_ATT_XTRA_NOTATION: {
      code: 1130,
      message:
         'Must not have more than one attribute of type NOTATION for the element type "{0}" (§3.3.1). Found "{1}".',
   },
   ATTLISTDECL_ATT_XTRA_NOTATION_VALUE: {
      code: 1132,
      message:
         'Must not have duplicate NOTATION values multiple times for the attribute "{1}" in the ATTLIST declaration for "{0}" (§3.3.1). Found "{2}".',
   },
   CONDITIONALSECTION_PEREF_INVALID_BRACKET: {
      code: 1134,
      message:
         'Must not include "[" in the replacement text for the parameter entity "{0}" in a conditional section (§3.4.0).',
   },
   CONTENT_PREMATURE_END: {
      code: 1136,
      message:
         'Element type "{0}" must have at least any one of the elments {1} before it ends (§3.0.0).',
   },
   CONTENTANY_INVALID_SYNTAX: {
      code: 1138,
      message:
         'The element "{0}" which has ANY content must not have syntax that is invalid in this version of XML ({1}/{2}) (§3.0.0). Found {3}.',
   },
   CONTENTELEMENT_AMBIGUOUS_SPACE: {
      code: 1140,
      message:
         'The element "{0}" which has ELEMENT content must not contain whitespace between children when it is externally declared and when standalone="yes" (§2.9.0).',
   },
   CONTENTELEMENT_CHILD_UNEXPECTED: {
      code: 1142,
      message: 'The element "{0}" must not have a child of type "{1}" in this position (§3.0.0).',
   },
   CONTENTELEMENT_INVALID_SYNTAX: {
      code: 1144,
      message:
         'The element "{0}" which has ELEMENT content must not have syntax that is invalid in this version of XML ({1}/{2}) (§3.0.0). Found {3}.',
   },
   CONTENTELEMENT_XTRA_SPACE: {
      code: 1146,
      message:
         'The element "{0}" must not have a space before the first child element or after the last child element in version 1.0/1 (§3.0.0).',
   },
   CONTENTEMPTY_INVALID_SYNTAX: {
      code: 1148,
      message:
         'The element "{0}" which has EMPTY content must not anything between the start and end tags (§3.0.0).',
   },
   CONTENTMIXED_CHILD_UNEXPECTED: {
      code: 1150,
      message: 'The element "{0}" must not have a child of type "{1}" (§3.0.0).',
   },
   CONTENTMIXED_INVALID_SYNTAX: {
      code: 1152,
      message:
         'The element "{0}" which has MIXED content must not have syntax that is invalid in this version of XML ({1}/{2}) (§3.0.0). Found {3}.',
   },
   ELEMENT_DOCTYPE_MISMATCH: {
      code: 1154,
      message:
         'The root element type "{1}" must match the document type declaration type "{0}" (§2.8.0).',
   },
   ELEMENT_NO_DECLARATION: {
      code: 1156,
      message: 'Missing declaration for element type "{0}" (§3.0.0).',
   },
   ELEMENT_XTRA_DECLARATION: {
      code: 1158,
      message: 'Must not declare the element type "{0}" multiple times (§3.2.0).',
   },
   ELEMENTDECL_XTRA_MIXED_NAME: {
      code: 1160,
      message:
         'Must not specify a child element name "{1}" multiple times in the declaration for element type "{0}" (§3.2.2).',
   },
   ELEMENTSTART_ATT_DEFAULT_EXTERNAL: {
      code: 1162,
      message:
         'The attribute "{1}" on element "{0}" must be declared in the internal subset when the document is standalone="yes" (§2.9.0).',
   },
   ELEMENTSTART_ATT_ENTITIES_NO_DECLARATION: {
      code: 1164,
      message:
         'Missing declaration for the entity "{0}" named in attribute "{2}" of element "{1}" (§3.3.1).',
   },
   ELEMENTSTART_ATT_ENTITY_NO_DECLARATION: {
      code: 1166,
      message:
         'Missing declaration for the entity "{0}" named in attribute "{2}" of element "{1}" (§3.3.1).',
   },
   ELEMENTSTART_ATT_ENUMERATION_NO_DECLARATION: {
      code: 1168,
      message:
         'Missing declaration for the value "{3}" named in attribute "{1}" of element "{0}" (§3.3.1). The declared values are {2}.',
   },
   ELEMENTSTART_ATT_IDREF_NO_ID: {
      code: 1170,
      message:
         'The ID "{2}" of attribute "{1}" of element "{0}" refers to an ID that is not in the document (§3.3.1).',
   },
   ELEMENTSTART_ATT_INVALID_ENTITIES_NAME: {
      code: 1172,
      message:
         'The entity name "{0}" in attribute "{2}" of element "{1}" must match the syntax for names (§3.3.1).',
   },
   ELEMENTSTART_ATT_INVALID_ENTITY_NAME: {
      code: 1174,
      message:
         'The entity name "{0}" in attribute "{2}" of element "{1}" must match the syntax for names (§3.3.1).',
   },
   ELEMENTSTART_ATT_INVALID_FIXED: {
      code: 1176,
      message:
         'The fixed attribute "{1}" on element "{0}" must have a value of "{2}". (§3.3.2). Found "{3}".',
   },
   ELEMENTSTART_ATT_INVALID_ID_NAME: {
      code: 1178,
      message:
         'The ID value "{2}" in attribute "{1}" of element "{0}" must match the syntax for names (§3.3.1).',
   },
   ELEMENTSTART_ATT_INVALID_IDREF_NAME: {
      code: 1180,
      message:
         'The IDREF value "{2}" for attribute "{1}" of element "{0}" must match the syntax for names (§3.3.1).',
   },
   ELEMENTSTART_ATT_INVALID_IDREFS_NAME: {
      code: 1182,
      message:
         'The IDREFS value "{2}" for attribute "{1}" of element "{0}" must match the syntax for names (§3.3.1).',
   },
   ELEMENTSTART_ATT_INVALID_NMTOKEN: {
      code: 1184,
      message:
         'The NMTOKEN value "{0}" for attribute "{2}" of element "{1}" must match the syntax for a name token (§3.3.1).',
   },
   ELEMENTSTART_ATT_INVALID_NMTOKENS: {
      code: 1186,
      message:
         'The NMTOKENS value "{0}" for attribute "{2}" of element "{1}" must match the syntax for name tokens (§3.3.1).',
   },
   ELEMENTSTART_ATT_NOTATION_NO_DECLARATION: {
      code: 1188,
      message:
         'Missing declaration for the value "{3}" named in attribute "{1}" of element "{0}" (§3.3.1). The declared values are {2}.',
   },
   ELEMENTSTART_ATT_PARSED_ENTITIES: {
      code: 1190,
      message:
         'The entities in attribute "{2}" of element "{1}" must all be unparsed (§3.3.1). Found parsed: "{0}".',
   },
   ELEMENTSTART_ATT_PARSED_ENTITY: {
      code: 1192,
      message:
         'The entity in attribute "{2}" of element "{1}" must be unparsed (§3.3.1). Found parsed: "{0}".',
   },
   ELEMENTSTART_ATT_UNDECLARED: {
      code: 1194,
      message: 'Must declare the attribute "{1}" for element "{0}" (§3.1.0).',
   },
   ELEMENTSTART_ATT_XTRA_ID: {
      code: 1196,
      message:
         'Must not use an ID value "{4}" more than once in a document (§3.3.1). Found on attribute "{1}" of element type "{0}" when earlier used on attribute "{3}" of element type "{2}".',
   },
   ELEMENTSTART_NO_REQUIRED: {
      code: 1198,
      message: 'Must include the required attribute "{1}" on element "{0}" (§3.3.2).',
   },
   ENTITYDECL_NO_NOTATION_DECLARATION: {
      code: 1200,
      message: 'Missing declaration for NDATA value "{1}" on the entity "{0}" (§4.2.2).',
   },
   ENTITYREF_EXTERNAL: {
      code: 1202,
      message:
         'The entity "{0}" most be declared in the internal subset when referenced in a document which is standalone="yes" (§2.9.0).',
   },
   GENERALENTITY_NO_DECLARATION: {
      code: 1204,
      message: 'Missing declaration for the general entity "{0}" (§4.1.0).',
   },
   NOTATION_XTRA_DECLARATION: {
      code: 1206,
      message: 'Must not declare a NOTATION more than once (§4.7.0). Found "{0}".',
   },
   PARAMETERENTITY_NO_DECLARATION: {
      code: 1208,
      message: 'Missing declaration for the parameter entity "{0}" (§4.1.0).',
   },
   PEREF_INVALID_CONDITIONALSECTION_END_NESTING: {
      code: 1210,
      message:
         'The last character (">") of a conditional section must not be found in the replacement text of a parameter entity reference when the first ("<") was not also there (§3.4.0).',
   },
   PEREF_INVALID_CONDITIONALSECTION_START_NESTING: {
      code: 1212,
      message:
         'The first character ("<") of a conditional section must not be found in the replacement text of a parameter entity reference when the last (">") was not also there (§3.4.0).',
   },
   PEREF_INVALID_END_NESTING: {
      code: 1214,
      message:
         'The last character of a {0} declaration must not be found in the replacement text of a parameter entity reference when the first was not also there (§2.8.0).',
   },
   PEREF_INVALID_START_NESTING: {
      code: 1216,
      message:
         'The first character ("<") of a {0} declaration must not be found in the replacement text of a parameter entity reference when the last (">") was not also there (§2.8.0).',
   },
   PEREF_PARENS_UNBALANCED: {
      code: 1218,
      message:
         'The replacement text for the parameter entity "{1}" was not properly nested in the content model for the element declaration "{0}" (§3.2.1).',
   },
});

export { validityErrorCodes };
