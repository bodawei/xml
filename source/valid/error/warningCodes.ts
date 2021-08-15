/* Copyright ® 2021 by 柏大衛. All rights reserved. */

// Recall, can not remove a key once we hit 1.0
// Note: We get codes 200-249
// Formats
// THING(_SUBTHING)(_problem) = "THING does not WHATEVER. Found OTHER"
// THING_NO_(whatever) = "Missing WHATEVER in a THING"
// THING_XTRA_... = " ..."

const warningCodes = {
   ELEMENT_CHILD_UNDECLARED: {
      code: 201,
      message:
         'The element declaration "{0}" references an element type "{1}" which has not been declared (§3.2.0).',
   },
   ELEMENT_START_USED_FOR_EMPTY_DECL: {
      code: 202,
      message:
         'For interoperability, should not use a start tag when the element type "{0}" is declared as EMPTY (§3.1.0).',
   },
   ENTITY_PREDEFINED_NO_DECLARATION: {
      code: 203,
      message: 'For interoperability, the predefined entity "{0} should be declared (§4.1.0).',
   },
   PEREF_NO_EMPTY_IN_MODEL: {
      code: 204,
      message:
         'For interoperability, the parameter entity "{1}" should not have empty replacement text when used in the content model of the declaration for element type "{0}" (§3.2.1).',
   },
   PEREF_NO_TRAILING_CONNECTOR: {
      code: 205,
      message:
         'For interoperability, the parmeter entity "{1}" shoud not have replacement text in the element declaration "{0}" that ends with "|" or "," (§3.2.1).',
   },
};

export { warningCodes };
