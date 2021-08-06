/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCodes } from 'basic';

const validError = new ErrorCodes({
   ELEMENTDECL_CONTENT_MODEL_NONDETERMINISTC: {
      code: 1200,
      message:
         'Element declarations must not have non-deterministic content models. In element "{0}" found {1}.',
   },
   XML_SPACE_BAD_CASE: {
      code: 1201,
      message: 'The "xml:space" attribute for "{0}" must be lower case (§2.10.0). Found "{1}".',
   },
   XML_SPACE_BAD_DECLARATION: {
      code: 1202,
      message:
         'The "xml:space" attribute for "{0}" must have at least one of "default" and "preserve" as enumerated values (§2.10.0).',
   },
   XML_SPACE_BAD_ENUMRATION: {
      code: 1203,
      message:
         'The "xml:space" attribute for "{0}" must have only "default" and/or "preserve" as values (§2.10.0). Found "{1}".',
   },
});

export { validError };
