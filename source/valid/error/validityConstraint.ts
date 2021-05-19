/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCodes } from 'basic';

const validityConstraint = new ErrorCodes({
   ELEMENT_MISMATCH_ROOT_TYPE: {
      code: 1101,
      message:
         'The name of the root element must match the type "{0}" in the document type declaration (§2.8.0). Found "{1}".',
   },
   NOTATION_XTRA_DECLARATION: {
      code: 1102,
      message: 'Must not declare a NOTATION more than once (§4.7.0). Found "{0}".',
   },
   ENTITYDECL_UNDECLARED_NOTATION: {
      code: 1103,
      message:
         'The declaration of the entity "{0}" must not have an undeclared NDATA value (§4.2.2). Found "{1}".',
   },
});

export { validityConstraint };
