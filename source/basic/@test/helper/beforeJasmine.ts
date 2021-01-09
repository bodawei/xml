/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

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

beforeEach(() => {
   jasmine.addMatchers({
      toBeInstanceOf,
   });
});

declare global {
   namespace jasmine {
      interface Matchers<T> {
         toBeInstanceOf(anObject: Object): void;
      }
   }
}

export { toBeInstanceOf };
