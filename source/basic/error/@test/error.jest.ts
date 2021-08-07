/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { error } from '../error';

describe('error', () => {
   it('contains codes from all the systems', () => {
      expect(error).toMatchInlineSnapshot(`
         ErrorCodes {
           "code": Object {
             "ELEMENTDECL_CONTENT_MODEL_NONDETERMINISTC": 1200,
             "REFERENCE_INVALID_UNPARSED": 1304,
             "SYSTEMLITERAL_NO_FRAGMENT": 1301,
             "TEXTDECL_VERSION_INVALID": 1302,
             "XMLDECL_VERSION_INVALID": 1303,
             "XMLSPACE_INVALID_VALUE": 1300,
             "XML_SPACE_BAD_CASE": 1201,
             "XML_SPACE_BAD_DECLARATION": 1202,
             "XML_SPACE_BAD_ENUMRATION": 1203,
           },
           "id": Object {
             "ELEMENTDECL_CONTENT_MODEL_NONDETERMINISTC": "ELEMENTDECL_CONTENT_MODEL_NONDETERMINISTC",
             "REFERENCE_INVALID_UNPARSED": "REFERENCE_INVALID_UNPARSED",
             "SYSTEMLITERAL_NO_FRAGMENT": "SYSTEMLITERAL_NO_FRAGMENT",
             "TEXTDECL_VERSION_INVALID": "TEXTDECL_VERSION_INVALID",
             "XMLDECL_VERSION_INVALID": "XMLDECL_VERSION_INVALID",
             "XMLSPACE_INVALID_VALUE": "XMLSPACE_INVALID_VALUE",
             "XML_SPACE_BAD_CASE": "XML_SPACE_BAD_CASE",
             "XML_SPACE_BAD_DECLARATION": "XML_SPACE_BAD_DECLARATION",
             "XML_SPACE_BAD_ENUMRATION": "XML_SPACE_BAD_ENUMRATION",
           },
           "mapping": Object {
             "ELEMENTDECL_CONTENT_MODEL_NONDETERMINISTC": Object {
               "code": 1200,
               "message": "Element declarations must not have non-deterministic content models. In element \\"{0}\\" found {1}.",
             },
             "REFERENCE_INVALID_UNPARSED": Object {
               "code": 1304,
               "message": "Must not reference an unparsed entity (§4.9.0). Found \\"{0}\\".",
             },
             "SYSTEMLITERAL_NO_FRAGMENT": Object {
               "code": 1301,
               "message": "The system literal must not contain fragments (§4.2.2). Found \\"{0}\\".",
             },
             "TEXTDECL_VERSION_INVALID": Object {
               "code": 1302,
               "message": "The Text Declaration version value must be \\"{0}\\". Found \\"{1}\\".",
             },
             "XMLDECL_VERSION_INVALID": Object {
               "code": 1303,
               "message": "The XML Declaration version value must be \\"{0}\\". Found \\"{1}\\".",
             },
             "XMLSPACE_INVALID_VALUE": Object {
               "code": 1300,
               "message": "The \\"xml:space\\" attribute must have either the value \\"preserve\\" or \\"default\\" (§2.10.0). Found \\"{0}\\".",
             },
             "XML_SPACE_BAD_CASE": Object {
               "code": 1201,
               "message": "The \\"xml:space\\" attribute for \\"{0}\\" must be lower case (§2.10.0). Found \\"{1}\\".",
             },
             "XML_SPACE_BAD_DECLARATION": Object {
               "code": 1202,
               "message": "The \\"xml:space\\" attribute for \\"{0}\\" must have at least one of \\"default\\" and \\"preserve\\" as enumerated values (§2.10.0).",
             },
             "XML_SPACE_BAD_ENUMRATION": Object {
               "code": 1203,
               "message": "The \\"xml:space\\" attribute for \\"{0}\\" must have only \\"default\\" and/or \\"preserve\\" as values (§2.10.0). Found \\"{1}\\".",
             },
           },
         }
      `);
   });
});
