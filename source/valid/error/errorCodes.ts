/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ProblemCodes } from 'basic';

const errorCodes = new ProblemCodes({
   ELEMENTDECL_CONTENTMODEL_NONDETERMINISTC: {
      code: 1200,
      message:
         'The declaration for "{0}" must have a deterministic content model (§3.2.1). Found {1}.',
   },
   XMLSPACE_NO_ENUMERATED_VALUES: {
      code: 1201,
      message:
         'Missing either "default" or "preserve" (or both) as enumerated values for the "xml:space" attribute for the element "{0}" (§2.10.0).',
   },
   XMLSPACE_XTRA_ENUMERATED_VALUE: {
      code: 1202,
      message:
         'Must not have values other than "default" and "preserve" in the enumeration for the "xml:space" attribute for "{0}" (§2.10.0). Found "{1}".',
   },
});

export { errorCodes };
