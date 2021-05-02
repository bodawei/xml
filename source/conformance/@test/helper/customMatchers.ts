/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { expect } from '@jest/globals';
import { ERROR_TYPE, WARNING_SUBTYPE } from 'basic';
import { PToken, ErrorToken } from 'token';

import { ErrorDetails } from './types';

interface JestResult {
   pass: boolean;
   message: () => string;
}
function toEqualNormalized(actual: Array<string>, expected = ''): JestResult {
   const actualJoined = actual.join('').replace(/\u0085/g, '&#133;');
   const expectedModified = expected.replace(/\u0085/g, '&#133;');
   const humanActual = actualJoined
      .replace(/&#10;/g, '\n')
      .replace(/&#9;/g, '\t')
      .replace(/&#13;/g, '\r');
   const humanExpected = expectedModified
      .replace(/&#10;/g, '\n')
      .replace(/&#9;/g, '\t')
      .replace(/&#13;/g, '\r');

   if (actualJoined === expectedModified) {
      return {
         pass: true,
         message: () => `EXPECTED\n${humanActual}\n\nNOT TO EQUAL\n${humanExpected}\n`,
      };
   }

   return {
      pass: false,
      message: () => `EXPECTED\n${humanActual}\n\nTO EQUAL\n${humanExpected}\n`,
   };
}

/*
 * Call this in two ways: either with no error ID's (which means you accept any errors)
 * or with an array of error ID's, in which case you are expecting each of those to
 * be found.
 */
function toHaveXmlConfErrors(
   actual: Array<PToken>,
   expected: Array<ErrorDetails | string> = [],
): JestResult {
   let message;

   const errorsExpected = expected.length > 0;
   const actualErrors: Array<ErrorToken> = actual.filter(
      (token) => token.type === ERROR_TYPE && token.subtype !== WARNING_SUBTYPE,
   ) as Array<ErrorToken>;

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

   if (errorsFound.length === 0) {
      errorsFound.push('No errors.');
   }

   const expectedDisplay = expected
      .map((info) => {
         return typeof info === 'string' ? info : info.id;
      })
      .join(', ');

   if (pass) {
      // expect(results).not.toHaveXmlConfErrors(['foo', 'bar']);
      if (errorsExpected) {
         message = () =>
            `Was expecting ${expectedDisplay}, but found ${errorsFound.join('\n\t')} instead.`;
      } else {
         // expect(results).not.toHaveXmlConfErrors();
         message = () =>
            `Expected no errors, but found the following errors:\n\t${errorsFound.join('\n\t')}\n`;
      }
   } else if (errorsExpected) {
      // expect(results).toHaveXmlConfErrors([ 'foo', 'bar']);
      message = () =>
         `Did not find ${expectedDisplay}, but instead found\n\t${errorsFound.join('\n\t')}\n`;
   } else {
      // expect(results).toHaveXmlConfErrors();
      message = () => 'Expected to find errors, but none were found.';
   }

   return {
      pass,
      message,
   };
}

// declare global {
//    // eslint-disable-next-line @typescript-eslint/no-namespace
//    namespace jest {
//       interface Matchers<R, T = {}> {
//          toHaveXmlConfErrors(stuff?: Array<string | ErrorDetails>): R;
//          toEqualNormalized(expected?: string): R;
//       }
//    }
// }

function installMatchers(): void {
   expect.extend({
      toHaveXmlConfErrors,
      toEqualNormalized,
   });
}
export { installMatchers };
