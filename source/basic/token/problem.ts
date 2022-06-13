/* Copyright ® 2021-2022 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';

import { makeOffset } from '../util/makeOffset';
import { Offset } from '../util/offset';
import { ProblemCodes } from '../util/problemCodes';

const ERROR_SEVERITY = 'ERROR_SEVERITY';
const FATAL_ERROR_SEVERITY = 'FATAL_ERROR_SSEVERITY';
const WARNING_SEVERITY = 'WARNING_SEVERITY';
const PROBLEM = 'PROBLEM';

type ProblemPosition = Offset | SToken;

type ProblemParam = ReadonlyArray<string | number | boolean>;

// Subclasses should expose a constructor with this signature.
interface ProblemConstructor {
   new (
      id: string,
      params?: ProblemParam,
      place?: ProblemPosition,
      context?: ProblemPosition,
   ): Problem;
}

class Problem {
   public readonly code: number;

   public readonly context?: Offset;

   public readonly id: string;

   public readonly message: string;

   public readonly place?: Offset;

   public readonly severity: string;

   public readonly type: typeof PROBLEM = PROBLEM;

   public readonly source: string;

   constructor(
      codes: ProblemCodes,
      severity: string,
      source: string,
      id: string,
      params?: ProblemParam,
      place?: ProblemPosition,
      context?: ProblemPosition,
   ) {
      this.id = id;
      this.code = codes.codeFor(id);
      this.context = makeOffset(context);
      this.message = codes.messageFor(id, params);
      this.place = makeOffset(place);
      this.severity = severity;
      this.source = source;
   }
}

export {
   ERROR_SEVERITY,
   FATAL_ERROR_SEVERITY,
   PROBLEM,
   WARNING_SEVERITY,
   ProblemParam,
   Problem,
   ProblemConstructor,
   ProblemPosition,
};
