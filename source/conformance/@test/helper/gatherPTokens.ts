/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';
import { ParseValue } from 'pToken';
import { PToken } from 'token';

function gatherPTokens(stream: Transform, expect: (results: Array<ParseValue>) => void): void {
   const cache: Array<PToken> = [];

   stream.on('data', (item: PToken) => {
      cache.push(item);
   });

   stream.on('end', () => {
      expect(cache);
   });
}

export { gatherPTokens };
