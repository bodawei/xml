const wellFormedWarnings = {
   ELEMENT_NAME_XML_RESERVED: {
      code: 401,
      message: 'Element names should not start with [Xx][Mm][Ll] (§2.3.0 - XML 1.0/6). Found "{0}"',
   },
   ELEMENT_NAME_XMLCOLON_RESERVED: {
      code: 402,
      message: 'Element names should not start with "xml:" (§2.3.0 - XML 1.0/6). Found "{0}"',
   },
   ELEMENTDECL_NAME_XML_RESERVED: {
      code: 403,
      message: 'Element names should not start with [Xx][Mm][Ll] (§2.3.0). Found "{0}"',
   },
   ELEMENTDECL_NAME_XMLCOLON_RESERVED: {
      code: 404,
      message: 'Element names should not start with "xml:". (§2.3.0 - XML 1.0/6). Found "{0}"',
   },
   ENTITYDECL_NAME_XML_RESERVED: {
      code: 405,
      message: 'Entity names should not start with [Xx][Mm][Ll] (§2.3.0). Found "{0}"',
   },
   ENTITYDECL_NAME_XMLDASH_RESERVED: {
      code: 406,
      message: 'Entity names should not start with "xml-". (§2.3.0 - XML 1.0/6). Found "{0}"',
   },
   ATTRIBUTE_NAME_XML_RESERVED: {
      code: 407,
      message: 'Attribute names should not start with [Xx][Mm][Ll] (§2.3.0). Found "{0}"',
   },
   ATTRIBUTE_NAME_XMLCOLON_RESERVED: {
      code: 408,
      message: 'Attribute names should not start with "xml:". (§2.3.0 - XML 1.0/6). Found "{0}"',
   },
   ATTLISTDECL_ATTR_NAME_XML_RESERVED: {
      code: 409,
      message: 'Attribute names should not start with [Xx][Mm][Ll] (§2.3.0). Found "{0}"',
   },
   ATTLISTDECL_ATTR_NAME_XMLCOLON_RESERVED: {
      code: 410,
      message: 'Attribute names should not start with "xml:". (§2.3.0 - XML 1.0/6). Found "{0}"',
   },
   NOTATIONDECL_NAME_XML_RESERVED: {
      code: 411,
      message: 'Notation names should not start with [Xx][Mm][Ll] (§2.3.0). Found "{0}"',
   },
   NOTATIONDECL_NAME_XMLDASH_RESERVED: {
      code: 412,
      message: 'Notation names should not start with "xml-". (§2.3.0 - XML 1.0/6). Found "{0}"',
   },
   PI_TARGET_XML_RESERVED: {
      code: 413,
      message:
         'Processing instruction targets should not start with [Xx][Mm][Ll] (§2.3.0). Found "{0}"',
   },
   PI_TARGET_XMLDASH_RESERVED: {
      code: 414,
      message:
         'Processing instruction targets should not start with "xml-". (§2.3.0 - XML 1.0/6). Found "{0}"',
   },
   ATTLISTDECL_ATTR_NAME_DUPLICATE: {
      code: 415,
      message:
         'Attribute names should not be listed multiple times in an ATTLIST declaration (§3.3.0). Found "{0}".',
   },
   CHARDATA_DISCOURAGED_CHAR: {
      code: 416,
      message: 'Discouraged eharacters should not be used in XML documents (§2.2.0). Found at: {0}',
   },
   XMLDECL_VERSION_INVALID: {
      code: 417,
      message: 'XML Declaration version value should be "{0}" (§2.8.0). Found: "{1}"',
   },
};

export { wellFormedWarnings };
