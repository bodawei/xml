/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ERROR_TYPE } from 'error';
import { PToken, XmlError } from 'token';

import { ErrorDetails } from './types';

interface JasmineResult {
   pass: boolean;
   message: string;
}

interface JestMatcher {
   compare: (actual: any, expected: any) => JasmineResult;
}

function toEqualNormalized(): JestMatcher {
   return {
      compare(actual: Array<string>, expected = ''): JasmineResult {
         const actualJoined = actual.join('');
         const humanActual = actualJoined
            .replace(/&#10;/g, '\n')
            .replace(/&#9;/g, '\t')
            .replace(/&#13;/g, '\r');
         const humanExpected = expected
            .replace(/&#10;/g, '\n')
            .replace(/&#9;/g, '\t')
            .replace(/&#13;/g, '\r');

         if (actualJoined === expected) {
            return {
               pass: true,
               message: `EXPECTED\n${humanActual}\n\nNOT TO EQUAL\n${humanExpected}\n`,
            };
         }

         console.log('Actual>\n', actualJoined, 'Expected\n', expected);
         return {
            pass: false,
            message: `EXPECTED\n${humanActual}\n\nTO EQUAL\n${humanExpected}\n`,
         };
      },
   };
}

/*
 * Call this in two ways: either with no error ID's (which means you accept any errors)
 * or with an array of error ID's, in which case you are expecting each of those to
 * be found.
 */
function toHaveErrors(): JestMatcher {
   return {
      compare: (
         actual: Array<PToken>,
         expected: Array<ErrorDetails | string> = [],
      ): JasmineResult => {
         let message;

         const errorsExpected = expected.length > 0;
         const actualErrors: Array<XmlError> = actual.filter(
            (token) => token.type === ERROR_TYPE && (token as XmlError).subtype !== 'WARNING',
         ) as Array<XmlError>;
         const hasAllExpectedErrors = expected.reduce((foundAll, expectedId) => {
            if (!expectedId) {
               return false;
            }

            const details: ErrorDetails =
               typeof expectedId !== 'string'
                  ? expectedId
                  : {
                       id: expectedId,
                       message: undefined,
                    };
            const foundError = actualErrors.some((err) => {
               const foundId = details.id === err.id;
               let foundMessage = true;

               if (typeof details.message === 'string') {
                  foundMessage = err.message.indexOf(details.message) !== -1;
               } else if (details.message instanceof RegExp) {
                  foundMessage = details.message.test(err.message);
               }

               return foundId && foundMessage;
            });

            return foundAll && foundError;
         }, true);

         const hasErrors = actualErrors.length !== 0;
         const errorsFound = actualErrors.map((error) => `${error.id} : ${error.message}`);
         const pass = (!errorsExpected && hasErrors) || (errorsExpected && hasAllExpectedErrors);

         if (pass) {
            // expect(results).not.toHaveErrors(['foo', 'bar']);
            if (errorsExpected) {
               message = `The errors ${expected.join(', ')} were found.`;
            } else {
               // expect(results).not.toHaveErrors();
               message = `Found the following errors:\n\t${errorsFound.join('\n\t')}\n`;
            }
         } else if (errorsExpected) {
            // expect(results).toHaveErrors([ 'foo', 'bar']);
            message = `Did not find ${expected.join(', ')}, but instead found\n\t${errorsFound.join(
               '\n\t',
            )}\n`;
         } else {
            // expect(results).toHaveErrors();
            message = 'Expected to find errors, but none were found.';
         }

         return {
            pass,
            message,
         };
      },
   };
}

declare global {
   // eslint-disable-next-line @typescript-eslint/no-namespace
   namespace jasmine {
      interface Matchers<T> {
         toHaveErrors(stuff?: Array<string | ErrorDetails>): void;
         toEqualNormalized(expected?: string): void;
      }
   }
}

beforeEach(() => {
   jasmine.addMatchers({
      toHaveErrors,
      toEqualNormalized,
   });
});
