/* Copyright ® 2021-2022 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { wellFormedWarningCodes } from '../wellFormedWarningCodes';

describe('wellFormedWarningCodes', () => {
   it('contains codes from all the systems', () => {
      expect(wellFormedWarningCodes).toMatchInlineSnapshot(`
         ErrorCodes {
           "code": Object {
             "ATTLISTDECL_ATTR_NAME_DUPLICATE": 415,
             "ATTLISTDECL_ATTR_NAME_XMLCOLON_RESERVED": 410,
             "ATTLISTDECL_ATTR_NAME_XML_RESERVED": 409,
             "ATTLISTDECL_ATTR_XTRA_DECLARATION": 421,
             "ATTLISTDECL_ELEMENT_XTRA_DECLARATION": 420,
             "ATTLISTDECL_NO_ELEMENTDECL": 422,
             "ATTRIBUTE_NAME_XMLCOLON_RESERVED": 408,
             "ATTRIBUTE_NAME_XML_RESERVED": 407,
             "CHARDATA_DISCOURAGED_CHAR": 416,
             "ELEMENTDECL_NAME_XMLCOLON_RESERVED": 404,
             "ELEMENTDECL_NAME_XML_RESERVED": 403,
             "ELEMENT_EMPTY_WITH_NONEMPTY_DECL": 418,
             "ELEMENT_NAME_XMLCOLON_RESERVED": 402,
             "ELEMENT_NAME_XML_RESERVED": 401,
             "ENTITYDECL_NAME_XMLDASH_RESERVED": 406,
             "ENTITYDECL_NAME_XML_RESERVED": 405,
             "ENTITYDECL_XRA_DECLARATION": 419,
             "NOTATIONDECL_NAME_XMLDASH_RESERVED": 412,
             "NOTATIONDECL_NAME_XML_RESERVED": 411,
             "PI_TARGET_XMLDASH_RESERVED": 414,
             "PI_TARGET_XML_RESERVED": 413,
             "XMLDECL_VERSION_INVALID": 417,
           },
           "id": Object {
             "ATTLISTDECL_ATTR_NAME_DUPLICATE": "ATTLISTDECL_ATTR_NAME_DUPLICATE",
             "ATTLISTDECL_ATTR_NAME_XMLCOLON_RESERVED": "ATTLISTDECL_ATTR_NAME_XMLCOLON_RESERVED",
             "ATTLISTDECL_ATTR_NAME_XML_RESERVED": "ATTLISTDECL_ATTR_NAME_XML_RESERVED",
             "ATTLISTDECL_ATTR_XTRA_DECLARATION": "ATTLISTDECL_ATTR_XTRA_DECLARATION",
             "ATTLISTDECL_ELEMENT_XTRA_DECLARATION": "ATTLISTDECL_ELEMENT_XTRA_DECLARATION",
             "ATTLISTDECL_NO_ELEMENTDECL": "ATTLISTDECL_NO_ELEMENTDECL",
             "ATTRIBUTE_NAME_XMLCOLON_RESERVED": "ATTRIBUTE_NAME_XMLCOLON_RESERVED",
             "ATTRIBUTE_NAME_XML_RESERVED": "ATTRIBUTE_NAME_XML_RESERVED",
             "CHARDATA_DISCOURAGED_CHAR": "CHARDATA_DISCOURAGED_CHAR",
             "ELEMENTDECL_NAME_XMLCOLON_RESERVED": "ELEMENTDECL_NAME_XMLCOLON_RESERVED",
             "ELEMENTDECL_NAME_XML_RESERVED": "ELEMENTDECL_NAME_XML_RESERVED",
             "ELEMENT_EMPTY_WITH_NONEMPTY_DECL": "ELEMENT_EMPTY_WITH_NONEMPTY_DECL",
             "ELEMENT_NAME_XMLCOLON_RESERVED": "ELEMENT_NAME_XMLCOLON_RESERVED",
             "ELEMENT_NAME_XML_RESERVED": "ELEMENT_NAME_XML_RESERVED",
             "ENTITYDECL_NAME_XMLDASH_RESERVED": "ENTITYDECL_NAME_XMLDASH_RESERVED",
             "ENTITYDECL_NAME_XML_RESERVED": "ENTITYDECL_NAME_XML_RESERVED",
             "ENTITYDECL_XRA_DECLARATION": "ENTITYDECL_XRA_DECLARATION",
             "NOTATIONDECL_NAME_XMLDASH_RESERVED": "NOTATIONDECL_NAME_XMLDASH_RESERVED",
             "NOTATIONDECL_NAME_XML_RESERVED": "NOTATIONDECL_NAME_XML_RESERVED",
             "PI_TARGET_XMLDASH_RESERVED": "PI_TARGET_XMLDASH_RESERVED",
             "PI_TARGET_XML_RESERVED": "PI_TARGET_XML_RESERVED",
             "XMLDECL_VERSION_INVALID": "XMLDECL_VERSION_INVALID",
           },
           "mapping": Object {
             "ATTLISTDECL_ATTR_NAME_DUPLICATE": Object {
               "code": 415,
               "message": "Attribute names should not be listed multiple times in an ATTLIST declaration (§3.3.0). Found \\"{0}\\".",
             },
             "ATTLISTDECL_ATTR_NAME_XMLCOLON_RESERVED": Object {
               "code": 410,
               "message": "Attribute names should not start with \\"xml:\\". (§2.3.0 - XML 1.0/6). Found \\"{0}\\"",
             },
             "ATTLISTDECL_ATTR_NAME_XML_RESERVED": Object {
               "code": 409,
               "message": "Attribute names should not start with [Xx][Mm][Ll] (§2.3.0). Found \\"{0}\\"",
             },
             "ATTLISTDECL_ATTR_XTRA_DECLARATION": Object {
               "code": 421,
               "message": "Should not declare the attribute \\"{1}\\" of element type \\"{0}\\" multiple times (§3.3.0).",
             },
             "ATTLISTDECL_ELEMENT_XTRA_DECLARATION": Object {
               "code": 420,
               "message": "Should not declare an ATTLIST for the element \\"{0}\\" multiple times (§3.3.0)",
             },
             "ATTLISTDECL_NO_ELEMENTDECL": Object {
               "code": 422,
               "message": "Missing the ELEMENT declaration for the element type \\"{0}\\" used in an ATTLIST declaration (§3.3.0).",
             },
             "ATTRIBUTE_NAME_XMLCOLON_RESERVED": Object {
               "code": 408,
               "message": "Attribute names should not start with \\"xml:\\". (§2.3.0 - XML 1.0/6). Found \\"{0}\\"",
             },
             "ATTRIBUTE_NAME_XML_RESERVED": Object {
               "code": 407,
               "message": "Attribute names should not start with [Xx][Mm][Ll] (§2.3.0). Found \\"{0}\\"",
             },
             "CHARDATA_DISCOURAGED_CHAR": Object {
               "code": 416,
               "message": "Discouraged eharacters should not be used in XML documents (§2.2.0). Found at: {0}",
             },
             "ELEMENTDECL_NAME_XMLCOLON_RESERVED": Object {
               "code": 404,
               "message": "Element names should not start with \\"xml:\\". (§2.3.0 - XML 1.0/6). Found \\"{0}\\"",
             },
             "ELEMENTDECL_NAME_XML_RESERVED": Object {
               "code": 403,
               "message": "Element names should not start with [Xx][Mm][Ll] (§2.3.0). Found \\"{0}\\"",
             },
             "ELEMENT_EMPTY_WITH_NONEMPTY_DECL": Object {
               "code": 418,
               "message": "Should not use empty elements unless the element type \\"{0}\\" is declared as EMPTY (§3.1.0).",
             },
             "ELEMENT_NAME_XMLCOLON_RESERVED": Object {
               "code": 402,
               "message": "Element names should not start with \\"xml:\\" (§2.3.0 - XML 1.0/6). Found \\"{0}\\"",
             },
             "ELEMENT_NAME_XML_RESERVED": Object {
               "code": 401,
               "message": "Element names should not start with [Xx][Mm][Ll] (§2.3.0 - XML 1.0/6). Found \\"{0}\\"",
             },
             "ENTITYDECL_NAME_XMLDASH_RESERVED": Object {
               "code": 406,
               "message": "Entity names should not start with \\"xml-\\". (§2.3.0 - XML 1.0/6). Found \\"{0}\\"",
             },
             "ENTITYDECL_NAME_XML_RESERVED": Object {
               "code": 405,
               "message": "Entity names should not start with [Xx][Mm][Ll] (§2.3.0). Found \\"{0}\\"",
             },
             "ENTITYDECL_XRA_DECLARATION": Object {
               "code": 419,
               "message": "Should not declare the entity \\"{0}\\" multiple times (§4.2.0).",
             },
             "NOTATIONDECL_NAME_XMLDASH_RESERVED": Object {
               "code": 412,
               "message": "Notation names should not start with \\"xml-\\". (§2.3.0 - XML 1.0/6). Found \\"{0}\\"",
             },
             "NOTATIONDECL_NAME_XML_RESERVED": Object {
               "code": 411,
               "message": "Notation names should not start with [Xx][Mm][Ll] (§2.3.0). Found \\"{0}\\"",
             },
             "PI_TARGET_XMLDASH_RESERVED": Object {
               "code": 414,
               "message": "Processing instruction targets should not start with \\"xml-\\". (§2.3.0 - XML 1.0/6). Found \\"{0}\\"",
             },
             "PI_TARGET_XML_RESERVED": Object {
               "code": 413,
               "message": "Processing instruction targets should not start with [Xx][Mm][Ll] (§2.3.0). Found \\"{0}\\"",
             },
             "XMLDECL_VERSION_INVALID": Object {
               "code": 417,
               "message": "XML Declaration version value should be \\"{0}\\" (§2.8.0). Found: \\"{1}\\"",
             },
           },
         }
      `);
   });
});
