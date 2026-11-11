/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { FATAL_ERROR_SEVERITY, Problem, ProblemPosition } from 'basic';

import { fatalErrorCodes } from './fatalErrorCodes';

class Error extends Problem {
   constructor(
      id: string,
      params?: ReadonlyArray<string | number | boolean>,
      place?: ProblemPosition,
      context?: ProblemPosition,
   ) {
      super(fatalErrorCodes, FATAL_ERROR_SEVERITY, 'wellformed', id, params, place, context);
   }
}

export { Error };
