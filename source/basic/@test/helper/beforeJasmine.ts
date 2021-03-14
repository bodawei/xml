/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { BaseError } from '../../BaseError';
import { XmlError } from '../../XmlError';
import { XmlWarning } from '../../XmlWarning';
import { MockErrorCollector } from './helper';
import { makeJasmineErrorMatcher } from './makeJasmineErrorMatcher';

interface JasmineResult {
   pass: boolean;
   message: string;
}

interface JestMatcher {
   compare: (actual: any, expected: any) => JasmineResult;
}

function toBeInstanceOf(): JestMatcher {
   return {
      compare: (actual: Function, expected: Function) => {
         if (typeof expected !== 'function') {
            throw new Error(
               'Must pass a function to the second argument of the .toBeInstanceOf() jasmine matcher.',
            );
         }
         if (typeof actual !== 'object' && typeof actual !== 'function') {
            throw new Error(
               'Must pass an object to the first argument of the .toBeInstanceOf() jasmine matcher.',
            );
         }

         const pass = actual instanceof expected;
         let message;

         // We can't report the instance name in IE11
         if (pass) {
            message = `Expected instance not to be an instance of ${expected.name}.`;
         } else {
            message = `Expected instance to be an instance of ${expected.name}. Found ${actual.constructor.name}`;
         }

         return {
            pass: pass,
            message: message,
         };
      },
   };
}

function toHaveError(util: any) {
   return {
      compare: (actual: any, expected: any) => {
         let pass = false;
         let message;

         actual.forEach((token: any) => {
            if (token.type === 'ERROR_TYPE') {
               const somePass =
                  token.id === expected.id &&
                  token.type === expected.type &&
                  token.message === expected.message;
               pass =
                  pass ||
                  (somePass &&
                     util.equals(token.place, expected.place) &&
                     util.equals(token.context, expected.context));
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
            message: message,
         };
      },
   };
}

function toBeErrorFree() {
   return {
      compare: (actual: any) => {
         let error: BaseError | undefined;
         let message: string;

         actual.forEach((token: any) => {
            if (token.type === 'ERROR_TYPE' && token.subtype !== 'WARNING') {
               error = token;
            }
         });

         if (!error!) {
            message = 'Expected to find one or more ErrorToken.';
         } else {
            message = `Expected to find no ErrorToken, but found ${(error as any).message}. (${
               (error as any).id
            })`; // typeHack
         }

         return {
            pass: !error!,
            message: message,
         };
      },
   };
}

function toBeErrorAndWarningFree() {
   return {
      compare: (actual: any) => {
         let error: BaseError | undefined;
         let message: string;

         actual.forEach((token: any) => {
            if (token.type === 'ERROR_TYPE') {
               error = token;
            }
         });

         if (!error!) {
            message = 'Expected to find one or more ErrorToken.';
         } else {
            message = `Expected to find no ErrorToken, but found ${(error as any).message}. (${
               (error as any).id
            })`; // typeHack
         }

         return {
            pass: !error!,
            message: message,
         };
      },
   };
}

function toNotReportError(util: any) {
   return {
      compare: (mockErrorCollector: MockErrorCollector, expectedId: string) => {
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
            message,
         };
      },
   };
}

function toReportWarning(util: any) {
   return makeJasmineErrorMatcher(util, XmlWarning);
}

function toReportXmlError(util: any) {
   return makeJasmineErrorMatcher(util, XmlError);
}

if (typeof jest === 'undefined') {
   beforeEach(() => {
      jasmine.addMatchers({
         toBeInstanceOf,
         toHaveError,
         toBeErrorFree,
         toBeErrorAndWarningFree,
         toNotReportError,
         toReportXmlError,
         toReportWarning,
      });
   });
}

interface ErrorProps {
   id: string;
   params?: Array<string>;
   position?: any;
   lastPosition?: any;
}

declare global {
   namespace jasmine {
      interface Matchers<T> {
         toBeInstanceOf(anObject: Object): void;
         toHaveError(expectedErrorTokenInstance: any): void; // given tokens: Array<any>,
         toBeErrorFree(): void; // given tokens: Array<any>
         toBeErrorAndWarningFree(): void; // given tokens: Array<any>
         toNotReportError(id: string): void;
         toReportWarning(errorProps: ErrorProps): void;
         toReportWFError(errorProps: ErrorProps): void; // not sure why this isn't picked up from wf
         toReportXmlError(errorProps: ErrorProps): void; // not sure why this isn't picked up from wf
      }
   }
}

export { toBeInstanceOf, toReportWarning, toReportXmlError };
