/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCodes } from 'basic';

const validityConstraint = new ErrorCodes({
   ELEMENT_MISMATCH_ROOT_TYPE: {
      code: 1101,
      message:
         'The name of the root element must match the type "{0}" in the document type declaration (§2.8.0). Found "{1}".',
   },
   NOTATION_XTRA_DECLARATION: {
      code: 1102,
      message: 'Must not declare a NOTATION more than once (§4.7.0). Found "{0}".',
   },
   ENTITYDECL_UNDECLARED_NOTATION: {
      code: 1103,
      message:
         'The declaration of the entity "{0}" must not have an undeclared NDATA value (§4.2.2). Found "{1}".',
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
   ELEMENTSTART_ENTITY_NOT_NAME: {
      code: 0,
      message:
         'The ENTITY value for attribute "{2}" of element "{1}" must match the syntax for names (§3.3.1). Found "{0}".',
   },
   ELEMENTSTART_ENTITIES_NOT_NAME: {
      code: 0,
      message:
         'The ENTITIES value for attribute "{2}" of element "{1}" must match the syntax for names (§3.3.1). Found "{0}".',
   },
   ELEMENTSTART_ENTITY_NO_ENTITY: {
      code: 1106,
      message:
         'The ENTITY value for attribute "{2}" of element "{1}" must name an unparsed declared entity (§3.3.1). Found "{0}".',
   },
   ELEMENTSTART_ENTITY_PARSED_ENTITY: {
      code: 1107,
      message:
         'The ENTITY value for attribute "{2}" of element "{1}" must name an unparsed declared entity (§3.3.1). Found "{0}".',
   },
   ELEMENTSTART_ENTITIES_NO_ENTITY: {
      code: 1108,
      message:
         'The ENTITIES value for attribute "{2}" of element "{1}" names one or more entities that were not declared (§3.3.1). Found: "{0}".',
   },
   ELEMENTSTART_ENTITIES_PARSED_ENTITY: {
      code: 1109,
      message:
         'The ENTITIES value for attribute "{2}" of element "{1}" names one or more parsed entities (§3.3.1). Found unparsed: "{0}".',
   },
   ATTLISTDECL_EMPTY_NOTATION: {
      code: 1110,
      message:
         'Must not have an attribute of type NOTATION on an EMPTY element "{0}" (§3.3.1). Found "{1}".',
   },
});

export { validityConstraint };
