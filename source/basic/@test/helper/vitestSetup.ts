/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { expect } from 'vitest';

import { ProblemCollector } from '../../util/problemCollector';
import { ParamCollector } from './paramCollector';

function toHaveProblem(collector: ProblemCollector, expectedId: string) {
   let pass = false;
   let message = `The problem "${expectedId}" was not reported.`;
   let problems: Array<{ id: string }>;
   const maybeCollector = collector as unknown as {
      getParams?: () => Array<{ id: string }>;
      getProblems?: () => Array<{ id: string }>;
   };

   if (maybeCollector.getProblems) {
      problems = maybeCollector.getProblems();
   } else {
      problems = maybeCollector.getParams?.() ?? [];
   }

   for (const actual of problems) {
      if (expectedId === actual.id) {
         pass = true;
         message = `The problem "${expectedId}" was reported.`;
      }
   }

   return {
      message: () => message,
      pass,
   };
}

function toHaveAnyProblems(collector: ParamCollector) {
   const problems = collector.getParams();

   return {
      message: () =>
         problems.length > 0 ? `Found ${problems.length} problems.` : 'Found no problems.',
      pass: problems.length > 0,
   };
}

expect.extend({
   toHaveProblem,
   toHaveAnyProblems,
});
