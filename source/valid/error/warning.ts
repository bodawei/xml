/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ProblemPosition, Problem, WARNING_SEVERITY } from 'basic';

import { warningCodes } from './warningCodes';

class Warning extends Problem {
   constructor(
      id: string,
      params?: ReadonlyArray<string | number | boolean>,
      place?: ProblemPosition,
      context?: ProblemPosition,
   ) {
      super(warningCodes, WARNING_SEVERITY, 'VALID', id, params, place, context);
   }
}

export { Warning };
