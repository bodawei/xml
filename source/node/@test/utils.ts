/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { offsetsAreEqual } from 'basic';
import { Readable } from 'stream';
import { PToken } from 'token';

function gatherStream(stream: Readable, expect: (results: Array<PToken>) => void, done: () => void) {
   const cache: Array<PToken> = [];

   stream.on('data', (item: PToken) => {
      cache.push(item);
   });

   stream.on('end', () => {
      expect(cache);

      done();
   });
};

function expectError(validator: Readable, expected: any, done: () => void) {
   gatherStream(validator, (tokens) => {
      let arrayExpected: Array<any> = [];

      if (!Array.isArray(expected)) {
         arrayExpected = [expected];
      }

      for (const expectedVal of arrayExpected) {
         let pass = false;

         tokens.forEach((token: any) => {
            if (token.type === 'PROBLEM') {
               const somePass =
                  token.id === expectedVal.id &&
                  token.type === expectedVal.type &&
                  token.message === expectedVal.message;
               pass =
                  pass ||
                  (somePass &&
                     offsetsAreEqual(token.place, expectedVal.place) &&
                     offsetsAreEqual(token.context, expectedVal.context));
            }
         });

         expect(pass).toEqual(true);
      }
   }, done);
}

export {
   expectError,
}

