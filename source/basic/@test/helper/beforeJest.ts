/* Copyright ® 2017-202 by 柏大衛. All rights reserved. */

import { expect } from '@jest/globals';
import { XmlErrorToken } from '../../error/XmlErrorToken';
import { MockErrorCollector } from './helper';
import { makeErrorMatcher as makeNewErrorMatcher } from './matcher/makeErrorMatcher';

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
   let error: XmlErrorToken | undefined;
   let message: string;

   actual.forEach((token: any) => {
      if (token.type === 'ERROR_TYPE' && token.subtype !== 'WARNING') {
         error = token;
      }
   });

   if (!error!) {
      message = 'Expected to find one or more XmlErrorTokens.';
   } else {
      message = `Expected to find no XmlErrorTokens, but found ${(error as any).message}. (${
         (error as any).id
      })`; // typeHack
   }

   return {
      pass: !error!,
      message: () => message,
   };
}

function toBeErrorAndWarningFree(actual: any) {
   let error: XmlErrorToken | undefined;
   let message: string;

   actual.forEach((token: any) => {
      if (token.type === 'ERROR_TYPE') {
         error = token;
      }
   });

   if (!error!) {
      message = 'Expected to find one or more XmlErrorTokens.';
   } else {
      message = `Expected to find no XmlErrorTokens, but found ${(error as any).message}. (${
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
   toBeErrorAndWarningFree,
   toBeErrorFree,
   toHaveError,
   toNotReportError,
   toReportError: makeNewErrorMatcher(), // should be an error
   toReportFatalError: makeNewErrorMatcher(), // should be a fatalError
   toReportWarning: makeNewErrorMatcher(), // should be warning
});
