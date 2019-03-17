/* Copyright ® 2018 by David John Burrowes. All rights reserved. */

import stream from 'readable-stream';

type PToken = { type: string };
type PTokenArray = Array<PToken>;

// function gatherResult(stream: stream.Transform, expect: (result: any) => void) {
//    stream.on('data', (item: PToken) => {
//       expect(item);
//    });
// }

function gatherStream(stream: stream.Transform, expect: (results: PTokenArray) => void, done: () => void) {
   const cache: PTokenArray = [];

   stream.on('data', (item: PToken) => {
      cache.push(item);
   });

   stream.on('end', () => {
      expect(cache);

      done();
   });
}

function expectNoErrorsOrWarnings(validator: stream.Transform, done: () => void) {
   gatherStream(validator, (tokens: PTokenArray) => {
      (expect(tokens) as any).toBeErrorAndWarningFree(); // typeHack
      done();
   }, done);
}

function expectError(validator: stream.Transform, expected: any, done: () => void) {
   gatherStream(validator, (tokens) => {
      let arrayExpected = [];

      if (!Array.isArray(expected)) {
         arrayExpected = [ expected ];
      }

      for (const expectedVal of arrayExpected) {
         (expect(tokens) as any).toHaveError(expectedVal); // typeHack
      }
   }, done);
}


// function expectNoErrors(validator: stream.Transform, done: () => void) {
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