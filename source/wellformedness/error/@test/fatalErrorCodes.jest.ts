/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { fatalErrorCodes } from '../fatalErrorCodes';

describe('fatalErrorCodes', () => {
   it('contains no codes by default', () => {
      expect(fatalErrorCodes).toMatchInlineSnapshot(`
         ProblemCodes {
           "code": {
             "REFERENCE_INVALID_UNPARSED": 2003,
             "TEXTDECL_INVALID_SPACE": 2002,
             "XMLDECL_INVALID_SPACE": 2001,
           },
           "id": {
             "REFERENCE_INVALID_UNPARSED": "REFERENCE_INVALID_UNPARSED",
             "TEXTDECL_INVALID_SPACE": "TEXTDECL_INVALID_SPACE",
             "XMLDECL_INVALID_SPACE": "XMLDECL_INVALID_SPACE",
           },
           "mapping": {
             "REFERENCE_INVALID_UNPARSED": {
               "code": 2003,
               "message": "Must not reference an unparsed entity (§4.9.0). Found "{0}"",
             },
             "TEXTDECL_INVALID_SPACE": {
               "code": 2002,
               "message": "Text Declarations must not have either the characters 0x85 or 0x2028 in them (§2.11.0 - XML 1.1). Found 0x{0}",
             },
             "XMLDECL_INVALID_SPACE": {
               "code": 2001,
               "message": "XML Declarations must not have either the characters 0x85 or 0x2028 in them (§2.11.0 - XML 1.1). Found 0x{0}",
             },
           },
         }
      `);
   });
});
