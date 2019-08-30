/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';
import { PToken } from 'token';

type PTokenArray = Array<PToken>;

// function gatherResult(stream: Transform, expect: (result: any) => void) {
//    stream.on('data', (item: PToken) => {
//       expect(item);
//    });
// }

function gatherStream(stream: Transform, expect: (results: PTokenArray) => void, done: () => void) {
   const cache: PTokenArray = [];

   stream.on('data', (item: PToken) => {
      cache.push(item);
   });

   stream.on('end', () => {
      expect(cache);

      done();
   });
}

function expectNoErrorsOrWarnings(validator: Transform, done: () => void) {
   gatherStream(validator, (tokens: PTokenArray) => {
      (expect(tokens) as any).toBeErrorAndWarningFree(); // typeHack
      done();
   }, done);
}

function expectError(validator: Transform, expected: any, done: () => void) {
   gatherStream(validator, (tokens) => {
      let arrayExpected = expected;

      if (!Array.isArray(expected)) {
         arrayExpected = [expected];
      }

      for (const expectedVal of arrayExpected) {
         (expect(tokens) as any).toHaveError(expectedVal); // typeHack
      }
   }, done);
}


// function expectNoErrors(validator: Transform, done: () => void) {
//    gatherStream(validator, (tokens: PTokenArray) => {
//       (expect(tokens) as any).toBeErrorFree(); // typeHack
//       done();
//    }, done);
// }

export {
   gatherStream,
   expectNoErrorsOrWarnings,
   expectError,
   // expectNoErrors,
};