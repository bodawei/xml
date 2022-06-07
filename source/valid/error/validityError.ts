/* Copyright ® 2016-2022 by 柏大衛. All rights reserved. */

import { ProblemPosition, Problem, ERROR_SEVERITY } from 'basic';

import { validityErrorCodes } from './validityErrorCodes';

class ValidityError extends Problem {
   constructor(
      id: string,
      params?: ReadonlyArray<string | number | boolean>,
      place?: ProblemPosition,
      context?: ProblemPosition,
   ) {
      super(validityErrorCodes, ERROR_SEVERITY, 'VALIDITY_CONSTRAINT', id, params, place, context);
   }
}

export { ValidityError };
