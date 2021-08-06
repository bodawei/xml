const validWarnings = {
   ATTLISTDECL_ELEMENT_XTRA_DECLARATION: {
      code: 201,
      message: 'Should not declare an ATTLIST for the element "{0}" multiple times (§3.3.0)',
   },
   ATTLISTDECL_NO_ELEMENTDECL: {
      code: 202,
      message:
         'Missing the ELEMENT declaration for the element type "{0}" used in an ATTLIST declaration (§3.3.0).',
   },
   ATTLISTDECL_ATTR_XTRA_DECLARATION: {
      code: 203,
      message:
         'Should not declare the attribute "{1}" of element type "{0}" multiple times (§3.3.0).',
   },
   ELEMENTDECL_PEREF_EMPTY: {
      code: 204,
      message:
         'The replacement text of the parameter entity "{1}" should not be empty in the content model of the element declaration for "{0}" (§3.2.1).',
   },
   ELEMENTDECL_PEREF_TRAILING_CONNECTOR: {
      code: 205,
      message:
         'The element declaration "{1}" shoud not have replacement text for the parameter entity "{1}" that ends with "|" or "," in the content model (§3.2.1).',
   },
   ENTITYDECL_XRA_DECLARATION: {
      code: 206,
      message: 'Should not declare the entity "{0}" multiple times (§4.2.0).',
   },
   ELEMENT_CHILD_UNDECLARED: {
      code: 207,
      message:
         'The element declaration "{0}" references an element type "{1}" which has not been declared (§3.2.0).',
   },
   // ELEMENT_EMPTY_WITH_NONEMPTY_DECL: {
   //    code: 208,
   //    message:
   //       'Should not use empty elements unless the element type "{0}" is declared as EMPTY (§3.1.0).',
   // },
   ELEMENT_WITH_EMPTY_DECL: {
      code: 209,
      message:
         'Should not use a start tag when the element type "{0}" is declared as EMPTY (§3.1.0).',
   },
   PREDEFINED_UNDECLARED: {
      code: 210,
      message: 'The predefined entity "{0} should be declared (§4.1.0).',
   },
};

export { validWarnings };
