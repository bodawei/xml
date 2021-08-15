/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { error } from '../error';

describe('error', () => {
   it('contains codes from all the systems', () => {
      expect(error).toMatchInlineSnapshot(`
         ErrorCodes {
           "code": Object {
             "ELEMENTDECL_CONTENTMODEL_NONDETERMINISTC": 1200,
             "REFERENCE_INVALID_UNPARSED": 1304,
             "SYSTEMLITERAL_NO_FRAGMENT": 1301,
             "TEXTDECL_VERSION_INVALID": 1302,
             "XMLDECL_VERSION_INVALID": 1303,
             "XMLSPACE_INVALID_VALUE": 1300,
             "XMLSPACE_NO_ENUMERATED_VALUES": 1201,
             "XMLSPACE_XTRA_ENUMERATED_VALUE": 1201,
           },
           "id": Object {
             "ELEMENTDECL_CONTENTMODEL_NONDETERMINISTC": "ELEMENTDECL_CONTENTMODEL_NONDETERMINISTC",
             "REFERENCE_INVALID_UNPARSED": "REFERENCE_INVALID_UNPARSED",
             "SYSTEMLITERAL_NO_FRAGMENT": "SYSTEMLITERAL_NO_FRAGMENT",
             "TEXTDECL_VERSION_INVALID": "TEXTDECL_VERSION_INVALID",
             "XMLDECL_VERSION_INVALID": "XMLDECL_VERSION_INVALID",
             "XMLSPACE_INVALID_VALUE": "XMLSPACE_INVALID_VALUE",
             "XMLSPACE_NO_ENUMERATED_VALUES": "XMLSPACE_NO_ENUMERATED_VALUES",
             "XMLSPACE_XTRA_ENUMERATED_VALUE": "XMLSPACE_XTRA_ENUMERATED_VALUE",
           },
           "mapping": Object {
             "ELEMENTDECL_CONTENTMODEL_NONDETERMINISTC": Object {
               "code": 1200,
               "message": "The declaration for \\"{0}\\" must have a deterministic content model (§3.2.1). Found {1}.",
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
             "XMLSPACE_NO_ENUMERATED_VALUES": Object {
               "code": 1201,
               "message": "Missing either \\"default\\" or \\"preserve\\" (or both) as enumerated values for the \\"xml:space\\" attribute for the element \\"{0}\\" (§2.10.0).",
             },
             "XMLSPACE_XTRA_ENUMERATED_VALUE": Object {
               "code": 1201,
               "message": "Must not have values other than \\"default\\" and \\"preserve\\" in the enumeration for the \\"xml:space\\" attribute for \\"{0}\\" (§2.10.0). Found \\"{1}\\".",
             },
           },
         }
      `);
   });
});
