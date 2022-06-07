/* Copyright ® 2022 by 柏大衛. All rights reserved. */

import { SToken } from 'sToken';

import { ProblemConstructor, ProblemParam, ProblemPosition } from '../token/problem';

interface Collector {
   setPos(currentSToken?: SToken | undefined): void;

   check(truthy: unknown, code: string, params?: ProblemParam, position?: ProblemPosition): void;

   report(code: string, params?: ProblemParam, position?: ProblemPosition): void;

   reportProblem(
      Constructor: ProblemConstructor,
      code: string,
      params?: ProblemParam,
      position?: ProblemPosition,
   ): void;
}

export { Collector };
