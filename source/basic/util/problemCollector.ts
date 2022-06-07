/* Copyright ® 2016-2022 by 柏大衛. All rights reserved. */

import { SToken } from 'sToken';

import { Problem, ProblemConstructor, ProblemParam, ProblemPosition } from '../token/problem';

import { Collector } from './collector';
import { makeOffset } from './makeOffset';
import { Offset } from './offset';
import { rangeEndOffset } from './rangeEndOffset';
import { rangeStartOffset } from './rangeStartOffset';

/**********************************************************************\
 An ProblemCollector collects a set of problems together in an array
 (retrievable with getPRoblems()). It provides various convenience
 routines to make it easy to create a problem.

 Because Problems carry contextual information (where the error
 occurred in the input file, as well as what overall token/context
 that was found) the primary motivation for this class is to
 make it much easier to provide that information.

 For example:
   <?xml VERSION="1.1" ?>
 In this case, the problem is that the "version" should not be upper
 case, so the position of the problem is 6 characters in. But,
 the context is the start of the XML Declaration, at 0 chars in.

 Sometimes the position can be difficult to compute for the callers.
 For instance, if a quote is missing but the previous couple STokens
 have been missing as well, it can get laborious to specify the
 best position.  This uses a heuristic which seems to always work,
 which is that when setPos() is called with a good SToken it is assumed
 the position for the next errors are at the start of that SToken.
 but if setPos() is called with undefined (a missing SToken), then
 the end of the most recently set SToken will be used for the next
 errors instead.
\**********************************************************************/

class ProblemCollector implements Collector {
   private DefaultConstructor: ProblemConstructor;

   private context: Offset | undefined;

   private currentSToken: SToken;

   private useCurrentSTokenStart: boolean;

   private problems: Array<Problem>;

   public constructor(context: SToken, DefaultConstructor: ProblemConstructor) {
      this.DefaultConstructor = DefaultConstructor;
      this.context = makeOffset(context);
      this.currentSToken = context;
      this.useCurrentSTokenStart = true;
      this.problems = [];
   }

   public getProblems(): ReadonlyArray<Problem> {
      return this.problems;
   }

   public appendFrom(other: ProblemCollector): void {
      this.problems = this.problems.concat(other.getProblems());
   }

   public setPos(currentSToken?: SToken | undefined): void {
      this.useCurrentSTokenStart = false;

      if (currentSToken) {
         this.currentSToken = currentSToken;
         this.useCurrentSTokenStart = true;
      }
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
      this.reportProblem(this.DefaultConstructor, code, params, position);
   }

   public reportProblem(
      Constructor: ProblemConstructor,
      code: string,
      params: ProblemParam = [],
      position?: ProblemPosition,
   ): void {
      let posOffset: Offset | undefined;

      if (position instanceof Offset) {
         posOffset = new Offset(position);
      } else if (position) {
         posOffset = rangeStartOffset(position.ranges[0]);
      } else if (!this.currentSToken) {
         // in the incredibly unlikely chance that we have an error without having seen a token
         posOffset = undefined;
      } else {
         posOffset = this.useCurrentSTokenStart
            ? rangeStartOffset(this.currentSToken.ranges[0])
            : rangeEndOffset(this.currentSToken.ranges[0]);
      }

      this.problems.push(new Constructor(code, params, posOffset, this.context));
   }
}

export { ProblemCollector };
