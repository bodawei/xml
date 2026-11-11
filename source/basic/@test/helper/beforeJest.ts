/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { expect } from '@jest/globals';

import { ProblemCollector } from '../../util/problemCollector';
import { ParamCollector } from './paramCollector';

function toHaveProblem(collector: ProblemCollector, expectedId: string) {
   let pass = false;
   let message = `The problem "${expectedId}" was not reported.`;
   let problems: Array<{ id: string }>;

   if ((collector as any).getProblems) {
      problems = (collector as any).getProblems() as Array<{ id: string }>;
   } else {
      problems = (collector as any).getParams() as Array<{ id: string }>;
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
