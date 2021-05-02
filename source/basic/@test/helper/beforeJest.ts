/* Copyright ® 2017-202 by 柏大衛. All rights reserved. */

import { expect } from '@jest/globals';
import { error } from '../..//error/error';
import { BaseError } from '../../BaseError';
import { warning } from '../../error/warning';
import { MockErrorCollector } from './helper';
import { makeErrorMatcher } from './makeErrorMatcher';
import { makeErrorMatcher as makeNewErrorMatcher } from './matcher/makeErrorMatcher';
import { fatalError } from '../../error/fatalError';

function toHaveError(actual: any, expected: any) {
   let pass = false;
   let message: string;

   actual.forEach((token: any) => {
      if (token.type === 'ERROR_TYPE') {
         pass = pass || this.equals(token, expected);
      }
   });

   if (pass) {
      message = `Expected not to find "${JSON.stringify(expected, undefined, 2)}".`;
   } else {
      message = `Expected to find "${JSON.stringify(
         expected,
         undefined,
         2,
      )}". Instead found ${JSON.stringify(actual, undefined, 2)}.`;
   }

   return {
      pass: pass,
      message: () => message,
   };
}

function toBeErrorFree(actual: any) {
   let error: BaseError | undefined;
   let message: string;

   actual.forEach((token: any) => {
      if (token.type === 'ERROR_TYPE' && token.subtype !== 'WARNING') {
         error = token;
      }
   });

   if (!error!) {
      message = 'Expected to find one or more ErrorTokens.';
   } else {
      message = `Expected to find no ErrorTokens, but found ${(error as any).message}. (${
         (error as any).id
      })`; // typeHack
   }

   return {
      pass: !error!,
      message: () => message,
   };
}

function toBeErrorAndWarningFree(actual: any) {
   let error: BaseError | undefined;
   let message: string;

   actual.forEach((token: any) => {
      if (token.type === 'ERROR_TYPE') {
         error = token;
      }
   });

   if (!error!) {
      message = 'Expected to find one or more ErrorTokens.';
   } else {
      message = `Expected to find no ErrorTokens, but found ${(error as any).message}. (${
         (error as any).id
      })`; // typeHack
   }

   return {
      pass: !error!,
      message: () => message,
   };
}

function toNotReportError(mockErrorCollector: MockErrorCollector, expectedId: string) {
   if (!mockErrorCollector) {
      throw new Error('Did not get a mock error collector as expected.');
   }

   const errors = mockErrorCollector.errors;
   let pass = true;
   let message = `No error with the id ${expectedId} reported.`;

   for (let index = 0; index < errors.length; index++) {
      const actual = errors[index];

      if (expectedId === actual.id) {
         pass = false;
         message = `The error ${expectedId} was found.`;
      }
   }

   return {
      pass,
      message: () => message,
   };
}

expect.extend({
   toHaveError,
   toBeErrorFree,
   toBeErrorAndWarningFree,
   toNotReportError,
   toReportWarning: makeNewErrorMatcher(warning),
   toReportError: makeNewErrorMatcher(error),
   toReportFatalError: makeNewErrorMatcher(fatalError),
});
