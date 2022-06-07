/* Copyright ® 2011-2022 by 柏大衛. All rights reserved. */

import { ProblemPosition, Problem, ERROR_SEVERITY } from 'basic';

import { errorCodes } from './errorCodes';

class Error extends Problem {
   constructor(
      id: string,
      params?: ReadonlyArray<string | number | boolean>,
      place?: ProblemPosition,
      context?: ProblemPosition,
   ) {
      super(errorCodes, ERROR_SEVERITY, 'VALID', id, params, place, context);
   }
}

export { Error };
