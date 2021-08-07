const validWarnings = {
   ELEMENTDECL_PEREF_EMPTY: {
      code: 204,
      message:
         'The replacement text of the parameter entity "{1}" should not be empty in the content model of the element declaration for "{0}" (§3.2.1).',
   },
   ELEMENTDECL_PEREF_TRAILING_CONNECTOR: {
      code: 205,
      message:
         'The element declaration "{0}" shoud not have replacement text for the parameter entity "{1}" that ends with "|" or "," in the content model (§3.2.1).',
   },
   ELEMENT_CHILD_UNDECLARED: {
      code: 207,
      message:
         'The element declaration "{0}" references an element type "{1}" which has not been declared (§3.2.0).',
   },
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
