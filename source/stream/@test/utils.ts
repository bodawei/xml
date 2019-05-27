/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';
import { PToken } from 'token';

function gatherStream(stream: stream.Readable, expect: (results: Array<PToken>) => void, done: () => void) {
   const cache: Array<PToken> = [];

   stream.on('data', (item: PToken) => {
      cache.push(item);
   });

   stream.on('end', () => {
      expect(cache);

      done();
   });
};

function expectError(validator: stream.Readable, expected: any, done: () => void) {
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

export {
   expectError,
}

