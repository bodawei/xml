const wellFormedFatalErrors = {
   XMLDECL_INVALID_SPACE: {
      code: 2001,
      message:
         'XML Declarations must not have either the characters 0x85 or 0x2028 in them (§2.11.0 - XML 1.1). Found 0x{0}',
   },
   TEXTDECL_INVALID_SPACE: {
      code: 2002,
      message:
         'Text Declarations must not have either the characters 0x85 or 0x2028 in them (§2.11.0 - XML 1.1). Found 0x{0}',
   },
   REFERENCE_NO_UNPARSED: {
      code: 2003,
      message: 'Must not reference an unparsed entity (§4.9.0). Found "{0}"',
   },
};

export { wellFormedFatalErrors };
