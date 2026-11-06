/* Copyright ® 2022 by 柏大衛. All rights reserved. */

import type { expect } from '@jest/globals';

import { ProblemCodes } from '../../util/problemCodes';

import { ParamCollector, ProblemParams } from './paramCollector';

type MatcherContext = ThisParameterType<Parameters<typeof expect.extend>[0][string]>;

function makeProblemMatcher(codes: ProblemCodes) {
   function problemMatcher(
      this: MatcherContext,
      paramCollector: ParamCollector,
      expected: Omit<ProblemParams, 'Constructor'>,
   ) {
      const params = paramCollector.getParams();
      let pass = false;
      let message = `No problem with the id ${expected.id} reported.`;

      for (const actual of params) {
         if (expected.id === actual.id) {
            const template = codes.messageTemplateFor(actual.id);

            if (!template) {
               pass = false;
               message = `${expected.id} is not a legal problem ID.`;
               break;
            } else {
               const theParams = actual.params || [];
               let count = 0;
               let offset = template.indexOf('{0}');

               while (offset !== -1) {
                  count++;
                  offset = template.indexOf(`{${count}}`);
               }

               if (count !== theParams.length) {
                  pass = false;
                  message = `${expected.id} expects ${count} parameters. Found ${theParams.length}.`;
                  break;
               }
            }

            if (!this.equals(expected.params, actual.params)) {
               message =
                  `Parameters for ${expected.id} do not match:\n` +
                  `  Actual:   ${(actual.params ?? []).join(',')}\n  Expected: ${(
                     expected.params ?? []
                  ).join(',')}`;
            } else if (!this.equals(expected.position, actual.position)) {
               message =
                  `Positions for ${expected.id} do not match:\n` +
                  `  Actual:   ${JSON.stringify(actual.position)}\n` +
                  `  Expected: ${JSON.stringify(expected.position)}`;
            } else if (
               (expected.lastPosition || !expected.position) &&
               !this.equals(expected.lastPosition, actual.lastPosition)
            ) {
               message =
                  `Last positions for ${expected.id} do not match:\n` +
                  `  Actual:   ${JSON.stringify(actual.lastPosition)}\n` +
                  `  Expected: ${JSON.stringify(expected.lastPosition)}`;
            } else {
               pass = true;
               message = `A match for ${expected.id} was found, but should not have.`;
            }
         }
      }

      return {
         message: () => message,
         pass,
      };
   }

   return problemMatcher;
}

export { makeProblemMatcher };
