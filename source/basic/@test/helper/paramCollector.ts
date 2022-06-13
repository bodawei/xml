/* Copyright ® 2022 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';

import { ProblemConstructor, ProblemParam, ProblemPosition } from '../../token/problem';
import { Collector } from '../../util/collector';

interface ProblemParams {
   readonly id: string;
   readonly lastPosition?: ProblemPosition;
   readonly params?: ProblemParam;
   readonly position: ProblemPosition | undefined;
}

/**********************************************************************\
 An ParamCollector is very much like a ProblemCollector, but instead
 of collecting Problems, it collects the parameters that would have
 been used to build them.  This is useful for unit tests of various
 validation routines.
\**********************************************************************/

class ParamCollector implements Collector {
   private params: Array<ProblemParams>;

   private lastDefined?: SToken;

   private lastPos?: SToken;

   public constructor() {
      this.params = [];
   }

   public getParams(): ReadonlyArray<ProblemParams> {
      return this.params;
   }

   public setPos(currentSToken?: SToken | undefined): void {
      if (currentSToken) {
         this.lastDefined = currentSToken;
      }

      this.lastPos = currentSToken;
   }

   public check(
      truthy: unknown,
      code: string,
      params?: ProblemParam,
      position?: ProblemPosition,
   ): void {
      if (truthy) {
         this.report(code, params, position);
      }
   }

   public report(code: string, params?: ProblemParam, position?: ProblemPosition): void {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      this.reportProblem(undefined as any, code, params, position);
   }

   public reportProblem(
      Constructor: ProblemConstructor,
      code: string,
      params: ProblemParam = [],
      position?: ProblemPosition,
   ): void {
      this.params.push({
         id: code,
         lastPosition: this.lastPos ? undefined : this.lastDefined,
         params,
         position: position ?? this.lastPos,
      });
   }
}

export { ParamCollector, ProblemParams };
