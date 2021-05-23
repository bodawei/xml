/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCodes } from 'basic';

const validityConstraint = new ErrorCodes({
   ATTLISTDECL_BAD_NOTATION: {
      code: 1111,
      message:
         'The attribute "{1}" of attribute list declaration "{0}" must name NOTATIONs that have been declared (§3.3.1). Found "{2}".',
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
   ELEMENT_MISMATCH_ROOT_TYPE: {
      code: 1101,
      message:
         'The name of the root element must match the type "{0}" in the document type declaration (§2.8.0). Found "{1}".',
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
   ELEMENTSTART_NOTATION_NOT_DECLARED: {
      code: 1112,
      message:
         'The NOTATION value for attribute "{1}" of element "{0}" must be one of the values declared ({2}) (§3.3.1). Found "{3}".',
   },
   ENTITYDECL_UNDECLARED_NOTATION: {
      code: 1103,
      message:
         'The declaration of the entity "{0}" must not have an undeclared NDATA value (§4.2.2). Found "{1}".',
   },
   NOTATION_XTRA_DECLARATION: {
      code: 1102,
      message: 'Must not declare a NOTATION more than once (§4.7.0). Found "{0}".',
   },
});

export { validityConstraint };
