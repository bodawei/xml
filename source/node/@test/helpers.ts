/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';

import { ParseToken } from 'pToken';
import { PToken } from 'token';

type PTokenArray = Array<ParseToken>;

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

export { gatherStream };
