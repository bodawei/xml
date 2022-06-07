/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ProblemCodes } from 'basic';

const errorCodes = new ProblemCodes({
   XMLSPACE_INVALID_VALUE: {
      code: 1300,
      message:
         'The "xml:space" attribute must have either the value "preserve" or "default" (§2.10.0). Found "{0}".',
   },
   SYSTEMLITERAL_NO_FRAGMENT: {
      code: 1301,
      message: 'The system literal must not contain fragments (§4.2.2). Found "{0}".',
   },
   TEXTDECL_VERSION_INVALID: {
      code: 1302,
      message: 'The Text Declaration version value must be "{0}". Found "{1}".',
   },
   XMLDECL_VERSION_INVALID: {
      code: 1303,
      message: 'The XML Declaration version value must be "{0}". Found "{1}".',
   },
   REFERENCE_INVALID_UNPARSED: {
      code: 1304,
      message: 'Must not reference an unparsed entity (§4.9.0). Found "{0}".',
   },
});

export { errorCodes };
